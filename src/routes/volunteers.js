const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register a new volunteer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, skills, lat, lng, zoneId } = req.body;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (
      !name ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !Number.isFinite(parsedLat) ||
      !Number.isFinite(parsedLng)
    ) {
      return res.status(400).json({ error: 'name, skills, lat, lng are required' });
    }

    const volunteer = {
      id: uuid(),
      uid: req.user.uid,
      name,
      email: email || '',
      phone: phone || '',
      skills,
      lat: parsedLat,
      lng: parsedLng,
      zoneId: zoneId || null,
      status: 'available',
      rating: 5.0,
      tasksCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    await db.collection('volunteers').doc(volunteer.id).set(volunteer);
    res.status(201).json({ message: 'Volunteer registered', volunteer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all volunteers with optional filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, skill, zoneId } = req.query;
    let query = db.collection('volunteers');

    if (status) query = query.where('status', '==', status);
    if (zoneId) query = query.where('zoneId', '==', zoneId);

    const snapshot = await query.get();
    let volunteers = snapshot.docs.map(doc => doc.data());

    if (skill) {
      volunteers = volunteers.filter(v => Array.isArray(v.skills) && v.skills.includes(skill));
    }

    res.json({ count: volunteers.length, volunteers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one volunteer by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('volunteers').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update volunteer status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    await db.collection('volunteers').doc(req.params.id).update({ status });
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
