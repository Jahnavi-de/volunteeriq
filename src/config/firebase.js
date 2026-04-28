const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function matchesWhere(data, filters) {
  return filters.every(filter => {
    const value = data[filter.field];
    if (filter.operator === '==') return value === filter.value;
    if (filter.operator === 'in') return Array.isArray(filter.value) && filter.value.includes(value);
    return false;
  });
}

function createMemoryDb() {
  const store = new Map();

  function collectionStore(name) {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name);
  }

  function makeSnapshot(items) {
    return {
      empty: items.length === 0,
      size: items.length,
      docs: items.map(([id, data]) => ({
        id,
        exists: true,
        data: () => ({ ...data }),
      })),
    };
  }

  function makeQuery(collectionName, filters = []) {
    return {
      where(field, operator, value) {
        return makeQuery(collectionName, [...filters, { field, operator, value }]);
      },
      async get() {
        const items = [...collectionStore(collectionName).entries()]
          .filter(([, data]) => matchesWhere(data, filters));
        return makeSnapshot(items);
      },
    };
  }

  return {
    collection(name) {
      const query = makeQuery(name);
      return {
        ...query,
        doc(id) {
          const docs = collectionStore(name);
          return {
            async get() {
              const data = docs.get(id);
              return {
                id,
                exists: Boolean(data),
                data: () => (data ? { ...data } : undefined),
              };
            },
            async set(data) {
              docs.set(id, { ...data });
            },
            async update(update) {
              const current = docs.get(id);
              if (!current) throw new Error(`Document ${name}/${id} not found`);
              docs.set(id, { ...current, ...update });
            },
          };
        },
      };
    },
  };
}

const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccount.json';
const serviceAccountPath = path.resolve(process.cwd(), configuredPath);

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const usingMemoryDb = !admin.apps.length;
const db = usingMemoryDb ? createMemoryDb() : admin.firestore();
if (usingMemoryDb) {
  console.warn('Firebase serviceAccount.json not found. Using in-memory demo database.');
}

module.exports = { admin, db, usingMemoryDb };
