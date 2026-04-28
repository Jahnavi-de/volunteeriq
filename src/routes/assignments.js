const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create an assignment from the frontend match panel
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const taskId = req.body.taskId || req.body.need_id;
    const volunteerId = req.body.volunteerId || req.body.volunteer_id;

    if (!taskId || !volunteerId) {
      return res.status(400).json({ error: 'taskId/need_id and volunteerId/volunteer_id are required' });
    }

    const [taskDoc, volunteerDoc] = await Promise.all([
      db.collection('tasks').doc(taskId).get(),
      db.collection('volunteers').doc(volunteerId).get(),
    ]);

    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
    if (!volunteerDoc.exists) return res.status(404).json({ error: 'Volunteer not found' });

    const task = taskDoc.data();
    const volunteer = volunteerDoc.data();
    const assignment = {
      id: uuid(),
      volunteerId,
      volunteerName: volunteer.name,
      taskId,
      taskTitle: task.title,
      matchScore: req.body.matchScore || null,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      completedAt: null,
      adminVerified: false,
    };

    await db.collection('assignments').doc(assignment.id).set(assignment);
    await db.collection('volunteers').doc(volunteerId).update({ status: 'busy' });
    await db.collection('tasks').doc(taskId).update({
      status: 'assigned',
      volunteersAssigned: Number(task.volunteersAssigned || 0) + 1,
    });

    res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all assignments with optional filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { volunteerId, taskId, status } = req.query;
    let query = db.collection('assignments');

    if (volunteerId) query = query.where('volunteerId', '==', volunteerId);
    if (taskId) query = query.where('taskId', '==', taskId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const assignments = snapshot.docs.map(doc => doc.data());
    res.json({ count: assignments.length, assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Volunteer marks their task as done
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const assignmentRef = db.collection('assignments').doc(req.params.id);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();

    // Mark assignment complete
    await assignmentRef.update({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    // Free the volunteer back to available
    await db.collection('volunteers').doc(assignment.volunteerId).update({
      status: 'available',
    });

    // Check if all volunteers on this task are done
    const allAssignments = await db.collection('assignments')
      .where('taskId', '==', assignment.taskId)
      .get();

    const allDone = allAssignments.docs.every(
      d => d.data().status === 'completed' || d.id === req.params.id
    );

    if (allDone) {
      await db.collection('tasks').doc(assignment.taskId).update({
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    res.json({ message: 'Task marked complete, volunteer is now available again' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin verifies the task was actually completed properly
router.patch('/:id/verify', verifyToken, requireAdmin, async (req, res) => {
  try {
    const assignmentRef = db.collection('assignments').doc(req.params.id);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();

    await assignmentRef.update({
      adminVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    // Update volunteer stats - they earned this
    const volRef = db.collection('volunteers').doc(assignment.volunteerId);
    const volDoc = await volRef.get();
    const volunteer = volDoc.data();

    await volRef.update({
      tasksCompleted: volunteer.tasksCompleted + 1,
    });

    res.json({ message: 'Assignment verified. Volunteer stats updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
