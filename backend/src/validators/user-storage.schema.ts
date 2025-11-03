export type UserStorageBody = {
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const userStorageSchema = {
  type: 'object',
  properties: {
    data: { type: 'object' },
    // allow object or null
    meta: { type: ['object', 'null'] },
  },
  required: ['data'],
  additionalProperties: false,
} as any;

export default userStorageSchema;
