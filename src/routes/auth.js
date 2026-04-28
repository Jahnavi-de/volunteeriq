const crypto = require('crypto');
const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function createDemoToken(user) {
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role,
    issuedAt: new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function cleanUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    const existing = await db.collection('users').where('email', '==', normalizedEmail).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = {
      id: uuid(),
      name,
      email: normalizedEmail,
      role: role || 'coordinator',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(user.id).set(user);
    res.status(201).json({
      token: createDemoToken(user),
      user: cleanUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const snapshot = await db.collection('users').where('email', '==', normalizedEmail).get();
    const user = snapshot.docs[0]?.data();

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      token: createDemoToken(user),
      user: cleanUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
