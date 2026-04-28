async function preloadDemoData(db) {
  const zones = await db.collection('zones').get();
  if (!zones.empty) return;

  const disasterId = 'disaster-demo-001';
  const zoneId = 'zone-demo-001';
  const now = new Date().toISOString();

  await db.collection('zones').doc(zoneId).set({
    id: zoneId,
    name: 'Flood Zone - Chennai South',
    lat: 13.0827,
    lng: 80.2707,
    affectedPeople: 500,
    severity: 'critical',
    disasterId,
    createdAt: now,
  });

  const volunteers = [
    { id: 'volunteer-demo-001', name: 'Priya Mehta', skills: ['first_aid', 'medical'], lat: 13.083, lng: 80.271 },
    { id: 'volunteer-demo-002', name: 'Rahul Singh', skills: ['cooking', 'food_distribution'], lat: 13.095, lng: 80.285 },
    { id: 'volunteer-demo-003', name: 'Anjali Kumar', skills: ['first_aid', 'driving'], lat: 13.085, lng: 80.275 },
    { id: 'volunteer-demo-004', name: 'Vikram Nair', skills: ['rescue', 'logistics'], lat: 13.08, lng: 80.27 },
    { id: 'volunteer-demo-005', name: 'Sunita Rao', skills: ['shelter', 'logistics'], lat: 13.075, lng: 80.265 },
  ];

  for (const volunteer of volunteers) {
    await db.collection('volunteers').doc(volunteer.id).set({
      ...volunteer,
      uid: `seed-user-${volunteer.id}`,
      email: `${volunteer.name.toLowerCase().replace(/\s+/g, '.')}@demo.org`,
      phone: '',
      zoneId,
      status: 'available',
      rating: 5,
      tasksCompleted: 0,
      createdAt: now,
    });
  }

  const tasks = [
    {
      id: 'task-demo-medical',
      title: 'First aid support for injured families',
      description: 'Several people need first aid and medicine after flooding.',
      type: 'Medical',
      category: 'Medical',
      requiredSkill: 'first_aid',
      requiredSkills: ['first_aid', 'medical'],
      zoneId,
      priority: 9,
      status: 'open',
      volunteersNeeded: 2,
      volunteersAssigned: 0,
      createdBy: 'demo',
      deadline: now,
      createdAt: now,
    },
    {
      id: 'task-demo-food',
      title: 'Food distribution at relief camp',
      description: 'Relief camp needs cooked meals and water distribution.',
      type: 'Food',
      category: 'Food',
      requiredSkill: 'food_distribution',
      requiredSkills: ['food_distribution', 'cooking'],
      zoneId,
      priority: 7,
      status: 'open',
      volunteersNeeded: 2,
      volunteersAssigned: 0,
      createdBy: 'demo',
      deadline: now,
      createdAt: now,
    },
  ];

  for (const task of tasks) {
    await db.collection('tasks').doc(task.id).set(task);
  }

  await db.collection('resources').doc('resource-demo-food').set({
    id: 'resource-demo-food',
    type: 'food',
    quantitySent: 200,
    quantityRemaining: 35,
    zoneId,
    createdAt: now,
    updatedAt: now,
  });
}

module.exports = { preloadDemoData };
