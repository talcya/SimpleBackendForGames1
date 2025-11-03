// Jest global setup: create a unique test DB name and persist it to a file so
// test worker processes can read it.
// prefer node: specifier to satisfy linter
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
module.exports = async function globalSetup() {
  const name = `test_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  // persist to file so worker processes can read the DB name — use absolute path
  const filePath = path.resolve(process.cwd(), 'tests/setup/.test_db_name');
  // ensure directory exists
  try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (err) { /* eslint-disable-line no-empty */ console.debug && console.debug('[global-setup] mkdir error', String(err)); }
  fs.writeFileSync(filePath, name, 'utf8');
  // also set env var for processes that inherit this env (not guaranteed for worker processes)
  process.env.TEST_DB_NAME = name;
  console.log('[global-setup] created TEST_DB_NAME=', name, 'file=', filePath);
};
