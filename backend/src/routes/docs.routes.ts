import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
// use require for js-yaml to avoid missing ambient types in older setups
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const yaml = require('js-yaml');

const router = express.Router();

// Serves the OpenAPI YAML converted to JSON at /openapi.json
// This helps Swagger UI or tools that prefer a JSON spec to fetch the API description.
router.get('/openapi.json', async (req, res) => {
  const specPath = path.join(__dirname, '../../public/openapi.yaml');
  try {
    const raw = await fs.promises.readFile(specPath, { encoding: 'utf8' });
    const doc = yaml.load(raw);
    return res.json(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error reading OpenAPI spec', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
