const { createServer } = require('../src/app');

async function run() {
  const created = await createServer();
  const server = created.server;
  const app = created.app;

  await new Promise<void>((resolve) => server.listen(0, resolve));
  // @ts-ignore
  const addr: any = server.address();
  const port = addr.port;
  const base = `http://127.0.0.1:${port}`;
  console.log('Server running on', base);

  try {
    const email = `script+${Date.now()}@example.com`;
    const signupResp = await fetch(`${base}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, displayName: 'script-user', password: 'password123' }),
    });
    const signup = await signupResp.json();
    console.log('signup', signup);
    const userId = signup.user.id;

    const loginResp = await fetch(`${base}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    const login = await loginResp.json();
    console.log('login', !!login.token);

    const scoreResp = await fetch(`${base}/v1/players/${userId}/score`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ score: 5555 }),
    });
    const score = await scoreResp.json();
    console.log('score response', score);

    console.log('Integration script succeeded');
  } catch (err: any) {
    console.error('Integration script failed', err?.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    await new Promise((res) => server.close(() => res(undefined)));
  }
}

run();
