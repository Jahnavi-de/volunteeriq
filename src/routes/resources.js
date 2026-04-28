const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Deploy resources to a zone
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { type, quantitySent, zoneId } = req.body;
    const parsedQuantitySent = Number(quantitySent);

    if (!type || !zoneId || !Number.isInteger(parsedQuantitySent) || parsedQuantitySent <= 0) {
      return res.status(400).json({ error: 'type, quantitySent, zoneId are required' });
    }

    const resource = {
      id: uuid(),
      type,
      quantitySent: parsedQuantitySent,
      quantityRemaining: parsedQuantitySent,
      zoneId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection('resources').doc(resource.id).set(resource);
    res.status(201).json({ message: 'Resources deployed', resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record consumption of resources
router.patch('/:id/consume', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;
    const parsedQuantity = Number(quantity);
    const ref = db.collection('resources').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) return res.status(404).json({ error: 'Resource not found' });
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const resource = doc.data();
    const remaining = Math.max(0, resource.quantityRemaining - parsedQuantity);

    await ref.update({
      quantityRemaining: remaining,
      updatedAt: new Date().toISOString(),
    });

    const percentLeft = Math.round((remaining / resource.quantitySent) * 100);
    let alert = null;
    if (percentLeft < 20) {
      alert = {
        level: percentLeft < 5 ? 'CRITICAL' : 'WARNING',
        message: `${resource.type} at zone ${resource.zoneId} is at ${percentLeft}% - resupply needed`,
      };
    }

    res.json({ remaining, percentLeft, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get resources - optionally filter by zone
router.get('/', verifyToken, async (req, res) => {
  try {
    const { zoneId } = req.query;
    let query = db.collection('resources');
    if (zoneId) query = query.where('zoneId', '==', zoneId);

    const snapshot = await query.get();
    res.json({ resources: snapshot.docs.map(d => d.data()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
