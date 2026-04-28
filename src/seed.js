require('dotenv').config();
const { db } = require('./config/firebase');

async function seed() {
  console.log('Seeding database with demo data...');

  const disasterId = 'disaster-demo-001';
  const zoneId = 'zone-demo-001';

  await db.collection('zones').doc(zoneId).set({
    id: zoneId,
    name: 'Flood Zone - Chennai South',
    lat: 13.0827,
    lng: 80.2707,
    affectedPeople: 500,
    severity: 'critical',
    disasterId,
    createdAt: new Date().toISOString(),
  });
  console.log('Zone upserted');

  const volunteers = [
    { id: 'volunteer-demo-001', name: 'Priya Mehta', skills: ['first_aid', 'counseling'], lat: 13.083, lng: 80.271 },
    { id: 'volunteer-demo-002', name: 'Rahul Singh', skills: ['cooking', 'food_distribution'], lat: 13.095, lng: 80.285 },
    { id: 'volunteer-demo-003', name: 'Anjali Kumar', skills: ['first_aid', 'driving'], lat: 13.085, lng: 80.275 },
    { id: 'volunteer-demo-004', name: 'Vikram Nair', skills: ['rescue', 'logistics'], lat: 13.08, lng: 80.27 },
    { id: 'volunteer-demo-005', name: 'Sunita Rao', skills: ['shelter', 'logistics'], lat: 13.075, lng: 80.265 },
    { id: 'volunteer-demo-006', name: 'Karthik Menon', skills: ['driving', 'rescue'], lat: 13.07, lng: 80.26 },
    { id: 'volunteer-demo-007', name: 'Deepa Krishnan', skills: ['medical', 'first_aid'], lat: 13.09, lng: 80.28 },
    { id: 'volunteer-demo-008', name: 'Arjun Iyer', skills: ['food_distribution', 'cooking'], lat: 13.1, lng: 80.29 },
  ];

  for (const volunteer of volunteers) {
    await db.collection('volunteers').doc(volunteer.id).set({
      id: volunteer.id,
      uid: `seed-user-${volunteer.id}`,
      name: volunteer.name,
      email: '',
      phone: '',
      skills: volunteer.skills,
      lat: volunteer.lat,
      lng: volunteer.lng,
      zoneId,
      status: 'available',
      rating: 5.0,
      tasksCompleted: 0,
      createdAt: new Date().toISOString(),
    });
  }
  console.log('8 volunteers upserted');

  const resources = [
    { id: 'resource-demo-food', type: 'food', quantitySent: 200 },
    { id: 'resource-demo-medicine', type: 'medicine', quantitySent: 100 },
    { id: 'resource-demo-blankets', type: 'blankets', quantitySent: 150 },
  ];

  for (const resource of resources) {
    await db.collection('resources').doc(resource.id).set({
      id: resource.id,
      type: resource.type,
      quantitySent: resource.quantitySent,
      quantityRemaining: resource.quantitySent,
      zoneId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  console.log('3 resources upserted');

  console.log('\nSeed complete! Demo data ready.');
  console.log('Disaster ID:', disasterId);
  console.log('Zone ID:', zoneId);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
