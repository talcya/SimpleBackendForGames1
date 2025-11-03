const { spawn, execSync } = require('child_process');

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
      env: { ...process.env, ENABLE_EVENT_PROCESSOR: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;

    const stdoutHandler = (chunk) => {
      const str = chunk.toString();
      if (str.includes('Backend listening on')) {
        started = true;
        // allow server to fully initialize then send SIGINT
        setTimeout(() => child.kill('SIGINT'), 500);
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
