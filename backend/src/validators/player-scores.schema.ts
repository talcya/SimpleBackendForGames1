export type PlayerScoreBody = {
  gameId: string;
  score: number;
  scope?: string;
  localId?: string | null;
};

export const playerScoreSchema = {
  type: 'object',
  properties: {
    gameId: { type: 'string' },
    score: { type: 'number' },
    // allow string or null
    scope: { type: ['string', 'null'] },
    localId: { type: ['string', 'null'] },
  },
  required: ['gameId', 'score'],
  additionalProperties: false,
} as any;

export default playerScoreSchema;
