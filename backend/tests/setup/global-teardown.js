// Jest global teardown: read persisted test DB name and drop it from Mongo.
// This runs in a separate process from tests, so we rely on the persisted file
// created by global-setup.js.
const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');
module.exports = async function globalTeardown() {
  const filePath = path.resolve(process.cwd(), 'tests/setup/.test_db_name');
  let name;
  try {
    name = fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    // no persisted name, nothing to drop
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ignored = err;
    console.warn('[global-teardown] no persisted test db name file found, skipping drop');
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri, { connectTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(name);
    await db.dropDatabase();
    console.log('[global-teardown] dropped test DB', name);
  } catch (err) {
    console.error('[global-teardown] failed to drop test DB', name, err);
  } finally {
    try { await client.close(); } catch (err) { console.debug && console.debug('[global-teardown] error closing mongo client', String(err)); }
    try { fs.unlinkSync(filePath); } catch (err) { console.debug && console.debug('[global-teardown] error removing persisted test DB name file', String(err)); }
  }
};
