const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');
const { scoreVolunteerMatch } = require('./pythonMlBridge');

// Calculate distance in km between two GPS coordinates
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Turn distance into a score from 0 to 1
function distanceScore(km) {
  if (km <= 1) return 1.0;
  if (km <= 5) return 0.8;
  if (km <= 15) return 0.5;
  if (km <= 30) return 0.2;
  return 0.0;
}

// Turn experience into a score from 0 to 1
function performanceScore(tasksCompleted, rating) {
  const safeTasksCompleted = Number.isFinite(tasksCompleted) ? tasksCompleted : 0;
  const safeRating = Number.isFinite(rating) ? rating : 1;
  const exp = Math.min(safeTasksCompleted / 20, 1);
  const rat = Math.min(Math.max((safeRating - 1) / 4, 0), 1);
  return exp * 0.5 + rat * 0.5;
}

// Score one volunteer against one task - returns 0 to 100
function scoreVolunteer(volunteer, task, taskZone) {
  const skills = Array.isArray(volunteer.skills) ? volunteer.skills : [];
  const requiredSkills = Array.isArray(task.requiredSkills) && task.requiredSkills.length > 0
    ? task.requiredSkills
    : [task.requiredSkill].filter(Boolean);

  // Hard requirement: must have the skill
  if (requiredSkills.length > 0 && !requiredSkills.some(skill => skills.includes(skill))) return 0;

  // Hard requirement: must be available
  if (volunteer.status !== 'available') return 0;

  const need = {
    id: task.id,
    requiredSkills,
    urgency: task.priority || task.urgency || 5,
    location: { latitude: taskZone.lat, longitude: taskZone.lng },
  };

  return scoreVolunteerMatch(volunteer, need).score;
}

// Main function: auto-assign best volunteers when a task is created
async function autoAssignVolunteers(task) {
  // Get the zone location (needed for distance scoring)
  const zoneDoc = await db.collection('zones').doc(task.zoneId).get();
  if (!zoneDoc.exists) {
    console.log('Zone not found for task:', task.zoneId);
    return [];
  }
  const zone = zoneDoc.data();

  // Get all currently available volunteers
  const snapshot = await db.collection('volunteers')
    .where('status', '==', 'available')
    .get();

  if (snapshot.empty) {
    console.log('No available volunteers found');
    return [];
  }

  // Score every volunteer
  const scored = snapshot.docs
    .map(doc => ({ volunteer: doc.data(), score: scoreVolunteer(doc.data(), task, zone) }))
    .filter(v => v.score > 0)
    .sort((a, b) => b.score - a.score);

  // Pick the best N volunteers
  const selected = scored.slice(0, task.volunteersNeeded);
  if (selected.length === 0) {
    console.log('No volunteers matched the required skill');
    return [];
  }

  const assignments = [];

  for (const { volunteer, score } of selected) {
    const assignment = {
      id: uuid(),
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      taskId: task.id,
      taskTitle: task.title,
      matchScore: score,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      completedAt: null,
      adminVerified: false,
    };

    await db.collection('assignments').doc(assignment.id).set(assignment);
    await db.collection('volunteers').doc(volunteer.id).update({ status: 'busy' });
    assignments.push(assignment);
  }

  // Update task status
  await db.collection('tasks').doc(task.id).update({
    volunteersAssigned: selected.length,
    status: selected.length > 0 ? 'assigned' : 'open',
  });

  console.log(`Assigned ${assignments.length} volunteer(s) to task: ${task.title}`);
  return assignments;
}

// Preview top matches without actually assigning
async function getBestMatches(taskId, limit = 5) {
  const taskDoc = await db.collection('tasks').doc(taskId).get();
  if (!taskDoc.exists) return [];
  const task = taskDoc.data();

  const zoneDoc = await db.collection('zones').doc(task.zoneId).get();
  if (!zoneDoc.exists) return [];
  const zone = zoneDoc.data();

  const snapshot = await db.collection('volunteers')
    .where('status', '==', 'available')
    .get();

  return snapshot.docs
    .map(doc => {
      const v = doc.data();
      return { ...v, matchScore: scoreVolunteer(v, task, zone) };
    })
    .filter(v => v.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

module.exports = { autoAssignVolunteers, getBestMatches, scoreVolunteer };
