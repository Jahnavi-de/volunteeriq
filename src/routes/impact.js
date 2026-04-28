const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { predictShortages, logImpact, getImpactSummary } = require('../services/demandPredictor');

const router = express.Router();

// Get shortage alerts for all zones
router.get('/shortages', verifyToken, async (req, res) => {
  try {
    const alerts = await predictShortages();
    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log impact for a specific zone
router.post('/log', verifyToken, async (req, res) => {
  try {
    const { disasterId, zoneId } = req.body;
    if (!disasterId || !zoneId) {
      return res.status(400).json({ error: 'disasterId and zoneId are required' });
    }
    const log = await logImpact(disasterId, zoneId);
    res.status(201).json({ message: 'Impact logged', log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full impact summary for a disaster
router.get('/summary/:disasterId', verifyToken, async (req, res) => {
  try {
    const summary = await getImpactSummary(req.params.disasterId);
    res.json({ disasterId: req.params.disasterId, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;