import { RequestHandler } from 'express';
import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export function validateSchema<T>(schema: JSONSchemaType<T>, source: 'body' | 'params' | 'query' = 'body'): RequestHandler {
  let validate: any;
  try {
    validate = ajv.compile(schema as any);
  } catch (err: unknown) {
    // improve debug output when schema compilation fails
    try {
      // eslint-disable-next-line no-console
      console.error('AJV compile failed for schema:', JSON.stringify(schema));
    } catch (error_: unknown) {
      // ignore
    }
    throw err;
  }
  return (req, res, next) => {
    const data = (req as any)[source];
    const ok = validate(data);
    if (ok) return next();
  const errors = (validate.errors || []).map((e: any) => `${e.instancePath} ${e.message}`).join('; ');
    return res.status(400).json({ message: 'validation failed', details: errors });
  };
}

export default validateSchema;
