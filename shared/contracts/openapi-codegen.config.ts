import path from 'path';

export default {
  input: path.resolve(__dirname, '../../specs/001-plan-game-stack/contracts/openapi.yaml'),
  output: path.resolve(__dirname, './src'),
  generator: 'typescript-fetch',
};
