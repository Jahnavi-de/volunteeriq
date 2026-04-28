const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

// Check all resources and flag ones running low
async function predictShortages() {
  const snapshot = await db.collection('resources').get();
  const alerts = [];

  for (const doc of snapshot.docs) {
    const r = doc.data();
    if (r.quantitySent === 0) continue;

    const pct = r.quantityRemaining / r.quantitySent;

    if (pct < 0.2) {
      alerts.push({
        resourceId: r.id,
        zoneId: r.zoneId,
        resourceType: r.type,
        remaining: r.quantityRemaining,
        totalSent: r.quantitySent,
        percentLeft: Math.round(pct * 100),
        severity: pct < 0.05 ? 'CRITICAL' : 'WARNING',
      });
    }
  }

  return alerts.sort((a, b) => a.percentLeft - b.percentLeft);
}

// Log the impact of operations in a zone
async function logImpact(disasterId, zoneId) {
  const zoneDoc = await db.collection('zones').doc(zoneId).get();
  if (!zoneDoc.exists) throw new Error('Zone not found');
  const zone = zoneDoc.data();

  const tasksSnap = await db.collection('tasks')
    .where('zoneId', '==', zoneId)
    .where('status', '==', 'verified')
    .get();

  const taskIds = tasksSnap.docs.map(doc => doc.id);
  let volunteersDeployed = 0;

  for (const taskIdChunk of chunkArray(taskIds, 10)) {
    const assignSnap = await db.collection('assignments')
      .where('taskId', 'in', taskIdChunk)
      .where('status', '==', 'completed')
      .get();

    volunteersDeployed += assignSnap.size;
  }

  const log = {
    id: uuid(),
    disasterId,
    zoneId,
    zoneName: zone.name,
    tasksCompleted: tasksSnap.size,
    volunteersDeployed,
    peopleHelped: zone.affectedPeople || 0,
    loggedAt: new Date().toISOString(),
  };

  await db.collection('impact_logs').doc(log.id).set(log);
  return log;
}

// Aggregate impact across all zones for a disaster
async function getImpactSummary(disasterId) {
  const snapshot = await db.collection('impact_logs')
    .where('disasterId', '==', disasterId)
    .get();

  const summary = snapshot.docs.reduce(
    (acc, doc) => {
      const d = doc.data();
      acc.totalTasksCompleted += d.tasksCompleted;
      acc.totalVolunteersDeployed += d.volunteersDeployed;
      acc.totalPeopleHelped += d.peopleHelped;
      acc.zonesServiced += 1;
      return acc;
    },
    { totalTasksCompleted: 0, totalVolunteersDeployed: 0, totalPeopleHelped: 0, zonesServiced: 0 }
  );

  return summary;
}

module.exports = { predictShortages, logImpact, getImpactSummary };
