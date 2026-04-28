require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, usingMemoryDb } = require('./config/firebase');
const { preloadDemoData } = require('./services/demoData');

const app = express();
app.use(cors());
app.use(express.json());

// Mount all routes
app.use('/api/volunteers',  require('./routes/volunteers'));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/tasks',       require('./routes/tasks'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/resources',   require('./routes/resources'));
app.use('/api/zones',       require('./routes/zones'));
app.use('/api/impact',      require('./routes/impact'));
app.use('/api/ai',          require('./routes/ai'));
app.use('/api',             require('./routes/compat'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Volunteer backend running', time: new Date() });
});

// Catch unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 5000;
async function start() {
  if (usingMemoryDb) {
    await preloadDemoData(db);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});
