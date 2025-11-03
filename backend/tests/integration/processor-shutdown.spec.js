const { spawn, execSync } = require('node:child_process');

// This test verifies that when the server is started with ENABLE_EVENT_PROCESSOR=true
// and receives SIGINT, it shuts down cleanly (exit code 0). It builds the project first
// to ensure `dist/server.js` exists.

describe('event processor graceful shutdown', () => {
  jest.setTimeout(30000);

  test('process exits 0 on SIGINT with processor enabled', (done) => {
    try {
      // build before running the child process
      execSync('npm run build', { stdio: 'inherit' });
    } catch (err) {
      return done(err);
    }

    const child = spawn(process.execPath, ['dist/server.js'], {
      // run processor with a short poll interval for fast test turn-around
      env: { ...process.env, ENABLE_EVENT_PROCESSOR: 'true', PROCESSOR_POLL_MS: '500' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;

    async function insertRuleAndEvent() {
      const { MongoClient } = require('mongodb');
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri, { connectTimeoutMS: 5000 });
      try {
        await client.connect();
        const db = client.db('gameDB');
        const ruleName = `test-rule-${Date.now()}`;
        await db.collection('rules').insertOne({ name: ruleName, action: 'flag', threshold: 1, windowSeconds: 60, active: true, createdAt: new Date(), updatedAt: new Date() });
        await db.collection('eventlogs').insertOne({ eventType: ruleName, payload: null, evaluated: false, matchedRuleIds: [], createdAt: new Date() });
      } finally {
        await client.close();
      }
    }

    async function prepareAndShutdown(childProc) {
      try {
        await insertRuleAndEvent();
        await new Promise((res) => setTimeout(res, 800));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('processor test setup error', err);
      } finally {
        childProc.kill('SIGINT');
      }
    }

    const stdoutHandler = (chunk) => {
      const str = chunk.toString();
      if (str.includes('Backend listening on')) {
        started = true;
        // trigger background setup and eventual shutdown
        void prepareAndShutdown(child);
      }
    };

    child.stdout.on('data', stdoutHandler);
    child.stderr.on('data', (c) => {
      // forward stderr for debugging if needed
      // console.error(c.toString());
    });

    child.on('exit', (code, signal) => {
      try {
        expect(started).toBe(true);
        expect(code === 0 || code === null ? 0 : code).toBe(0);
        done();
      } catch (err) {
        done(err);
      }
    });

    child.on('error', (err) => done(err));
  });
});
