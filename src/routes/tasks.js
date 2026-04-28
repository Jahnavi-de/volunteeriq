const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { autoAssignVolunteers, getBestMatches } = require('../services/matchingEngine');

const router = express.Router();

// Create a new task - triggers auto assignment
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, type, requiredSkill, zoneId, priority, volunteersNeeded, deadline } = req.body;
    const parsedPriority = priority === undefined ? 2 : Number(priority);
    const parsedVolunteersNeeded = volunteersNeeded === undefined ? 1 : Number(volunteersNeeded);

    if (!title || !requiredSkill || !zoneId) {
      return res.status(400).json({ error: 'title, requiredSkill, zoneId are required' });
    }

    if (!Number.isInteger(parsedPriority) || parsedPriority < 1) {
      return res.status(400).json({ error: 'priority must be a positive integer' });
    }

    if (!Number.isInteger(parsedVolunteersNeeded) || parsedVolunteersNeeded < 1) {
      return res.status(400).json({ error: 'volunteersNeeded must be a positive integer' });
    }

    const task = {
      id: uuid(),
      title,
      type: type || 'general',
      requiredSkill,
      zoneId,
      priority: parsedPriority,
      status: 'open',
      volunteersNeeded: parsedVolunteersNeeded,
      volunteersAssigned: 0,
      createdBy: req.user.uid,
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
    };

    await db.collection('tasks').doc(task.id).set(task);

    // Auto-assign best volunteers immediately
    const assignments = await autoAssignVolunteers(task);

    res.status(201).json({
      message: 'Task created and volunteers assigned',
      task,
      assignments,
      assignedCount: assignments.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks with filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, zoneId, priority } = req.query;
    let query = db.collection('tasks');

    if (status) query = query.where('status', '==', status);
    if (zoneId) query = query.where('zoneId', '==', zoneId);
    if (priority) query = query.where('priority', '==', parseInt(priority, 10));

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => doc.data());
    res.json({ count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one task
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('tasks').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Task not found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview best volunteer matches for a task
router.get('/:id/matches', verifyToken, async (req, res) => {
  try {
    const matches = await getBestMatches(req.params.id);
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status through lifecycle
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'assigned', 'in_progress', 'completed', 'verified'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = { status };
    if (status === 'completed') update.completedAt = new Date().toISOString();
    if (status === 'verified') update.verifiedAt = new Date().toISOString();

    await db.collection('tasks').doc(req.params.id).update(update);
    res.json({ message: `Task status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
