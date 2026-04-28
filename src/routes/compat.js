const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { analyzeFieldReport, predictZoneDemand, scoreVolunteerMatch } = require('../services/pythonMlBridge');
const { autoAssignVolunteers } = require('../services/matchingEngine');

const router = express.Router();

function mapCategory(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('aid') || normalized.includes('medical')) return 'Medical';
  if (normalized.includes('rescue')) return 'Rescue';
  if (normalized.includes('food') || normalized.includes('cooking')) return 'Food';
  if (normalized.includes('shelter')) return 'Shelter';
  return 'Other';
}

function statusToNeedStatus(status) {
  if (status === 'verified') return 'closed';
  if (status === 'completed') return 'completed';
  if (status === 'assigned' || status === 'in_progress') return 'assigned';
  return 'open';
}

async function getZoneMap() {
  const snapshot = await db.collection('zones').get();
  return new Map(snapshot.docs.map(doc => [doc.id, doc.data()]));
}

async function getAssignmentsByTask() {
  const snapshot = await db.collection('assignments').get();
  const grouped = new Map();
  for (const doc of snapshot.docs) {
    const assignment = doc.data();
    if (!grouped.has(assignment.taskId)) grouped.set(assignment.taskId, []);
    grouped.get(assignment.taskId).push(assignment.volunteerId);
  }
  return grouped;
}

function taskToNeed(task, zone, assignmentIds = []) {
  const urgency = Math.min(Math.max(Number(task.priority || 5), 1), 10);
  return {
    id: task.id,
    title: task.title,
    description: task.description || `${task.type || 'General'} support needed in ${zone?.name || 'field zone'}`,
    category: task.category || mapCategory(task.type || task.requiredSkill),
    urgency,
    location: {
      latitude: Number(zone?.lat || 0),
      longitude: Number(zone?.lng || 0),
      address: zone?.name || task.zoneId,
    },
    requiredSkills: task.requiredSkills || [task.requiredSkill].filter(Boolean),
    volunteersNeeded: Number(task.volunteersNeeded || 1),
    status: statusToNeedStatus(task.status),
    createdAt: task.createdAt,
    deadline: task.deadline || task.createdAt,
    assignedVolunteers: assignmentIds,
  };
}

function volunteerToClient(volunteer, assignedNeeds = []) {
  const availability = volunteer.status === 'available' ? 'available' : volunteer.status === 'busy' ? 'limited' : 'unavailable';
  return {
    id: volunteer.id,
    name: volunteer.name,
    email: volunteer.email || '',
    phone: volunteer.phone || '',
    skills: volunteer.skills || [],
    availability,
    location: {
      latitude: Number(volunteer.lat || 0),
      longitude: Number(volunteer.lng || 0),
      address: volunteer.zoneId || 'Field location',
    },
    hoursAvailable: volunteer.hoursAvailable || (availability === 'available' ? 8 : 2),
    assignedNeeds,
    totalHours: volunteer.totalHours || Number(volunteer.tasksCompleted || 0) * 4,
    createdAt: volunteer.createdAt,
  };
}

async function loadNeeds() {
  const [tasksSnap, zoneMap, assignmentsByTask] = await Promise.all([
    db.collection('tasks').get(),
    getZoneMap(),
    getAssignmentsByTask(),
  ]);

  return tasksSnap.docs.map(doc => {
    const task = doc.data();
    return taskToNeed(task, zoneMap.get(task.zoneId), assignmentsByTask.get(task.id) || []);
  });
}

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [needs, volunteersSnap] = await Promise.all([
      loadNeeds(),
      db.collection('volunteers').get(),
    ]);
    const volunteers = volunteersSnap.docs.map(doc => doc.data());
    const assignedNeeds = needs.filter(need => need.status === 'assigned').length;
    const completedTasks = needs.filter(need => need.status === 'completed' || need.status === 'closed').length;
    const urgentCount = needs.filter(need => need.urgency >= 7).length;
    const averageUrgency = needs.length
      ? needs.reduce((sum, need) => sum + need.urgency, 0) / needs.length
      : 0;

    res.json({
      totalNeeds: needs.length,
      assignedNeeds,
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.status !== 'offline').length,
      completedTasks,
      urgentCount,
      averageUrgency,
      assignmentRate: needs.length ? assignedNeeds / needs.length : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/needs', verifyToken, async (req, res) => {
  try {
    let needs = await loadNeeds();
    if (req.query.category) needs = needs.filter(need => need.category === req.query.category);
    if (req.query.status) needs = needs.filter(need => need.status === req.query.status);
    if (req.query.min_urgency) needs = needs.filter(need => need.urgency >= Number(req.query.min_urgency));
    res.json(needs.sort((a, b) => b.urgency - a.urgency));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/needs', verifyToken, async (req, res) => {
  try {
    const need = req.body;
    const zoneId = need.zoneId || `zone-${uuid()}`;

    if (!need.zoneId) {
      await db.collection('zones').doc(zoneId).set({
        id: zoneId,
        name: need.location?.address || 'Field report zone',
        lat: Number(need.location?.latitude || 0),
        lng: Number(need.location?.longitude || 0),
        affectedPeople: need.affectedPeople || 0,
        severity: Number(need.urgency || 5) >= 8 ? 'critical' : 'high',
        disasterId: need.disasterId || 'disaster-demo-001',
        createdAt: new Date().toISOString(),
      });
    }

    const task = {
      id: uuid(),
      title: need.title,
      description: need.description || '',
      type: need.category || 'Other',
      category: need.category || 'Other',
      requiredSkill: need.requiredSkills?.[0] || 'logistics',
      requiredSkills: need.requiredSkills || ['logistics'],
      zoneId,
      priority: Number(need.urgency || 5),
      status: 'open',
      volunteersNeeded: Number(need.volunteersNeeded || 1),
      volunteersAssigned: 0,
      createdBy: req.user.uid,
      deadline: need.deadline || null,
      createdAt: new Date().toISOString(),
    };

    await db.collection('tasks').doc(task.id).set(task);
    await autoAssignVolunteers(task);
    const zone = (await db.collection('zones').doc(zoneId).get()).data();
    res.status(201).json(taskToNeed(task, zone, []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/matches', verifyToken, async (req, res) => {
  try {
    const needId = req.query.need_id || req.query.needId;
    if (!needId) return res.status(400).json({ error: 'need_id is required' });

    const taskDoc = await db.collection('tasks').doc(needId).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Need not found' });

    const task = taskDoc.data();
    const zoneDoc = await db.collection('zones').doc(task.zoneId).get();
    const need = taskToNeed(task, zoneDoc.data(), []);
    const volunteersSnap = await db.collection('volunteers').get();
    const matches = volunteersSnap.docs
      .map(doc => scoreVolunteerMatch(volunteerToClient(doc.data()), need))
      .filter(match => match.availabilityMatch > 0 && match.skillMatch > 0)
      .sort((a, b) => b.score - a.score);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/field-reports', verifyToken, async (req, res) => {
  try {
    const analysis = analyzeFieldReport(req.body);
    res.status(201).json({
      id: uuid(),
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      timestamp: new Date().toISOString(),
      extractedNeeds: analysis.extractedNeeds,
      urgencyLevel: analysis.urgency,
      model: analysis,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights/clusters', verifyToken, async (req, res) => {
  try {
    const [zoneSnap, tasksSnap, resourceSnap] = await Promise.all([
      db.collection('zones').get(),
      db.collection('tasks').get(),
      db.collection('resources').get(),
    ]);
    const tasks = tasksSnap.docs.map(doc => doc.data());
    const resources = resourceSnap.docs.map(doc => doc.data());
    const clusters = zoneSnap.docs.map(doc => {
      const zone = doc.data();
      const zoneTasks = tasks.filter(task => task.zoneId === zone.id);
      const assigned = zoneTasks.filter(task => ['assigned', 'in_progress', 'completed', 'verified'].includes(task.status)).length;
      const prediction = predictZoneDemand(zone, zoneTasks, resources.filter(resource => resource.zoneId === zone.id));

      return {
        id: zone.id,
        name: zone.name,
        location: { latitude: Number(zone.lat || 0), longitude: Number(zone.lng || 0) },
        needCount: zoneTasks.length,
        urgencyScore: prediction.demandScore,
        assignmentRate: zoneTasks.length ? assigned / zoneTasks.length : 0,
        coordinatesLng: [Number(zone.lng || 0)],
        coordinatesLat: [Number(zone.lat || 0)],
        prediction,
      };
    });

    res.json(clusters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights/leaderboard', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('volunteers').get();
    const leaderboard = snapshot.docs
      .map(doc => {
        const volunteer = doc.data();
        const tasksCompleted = Number(volunteer.tasksCompleted || 0);
        return {
          volunteerId: volunteer.id,
          name: volunteer.name,
          hoursServed: volunteer.totalHours || tasksCompleted * 4,
          tasksCompleted,
        };
      })
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted || b.hoursServed - a.hoursServed)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/model/analyze-report', verifyToken, (req, res) => {
  res.json({ success: true, analysis: analyzeFieldReport(req.body) });
});

module.exports = router;
