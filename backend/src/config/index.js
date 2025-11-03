// JS shim for runtime when TypeScript isn't compiled yet
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

exports.config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gameDB',
  jwtSecret: process.env.JWT_SECRET || 'change-me-please',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

exports.connectMongo = async function connectMongo() {
  if (!exports.config.mongoUri) throw new Error('MONGO_URI not configured');
  await mongoose.connect(exports.config.mongoUri, { dbName: 'gameDB' });
  return mongoose.connection;
};

// Runtime-evaluated flags helper for environments that import the JS shim.
function getRuntimeFlags() {
  const dev = (process.env.DEV_MODE === 'true') || process.env.NODE_ENV === 'development';
  const enableDocs = process.env.ENABLE_DOCS ? process.env.ENABLE_DOCS === 'true' : dev;
  const enableDevRoutes = process.env.ENABLE_DEV_ROUTES ? process.env.ENABLE_DEV_ROUTES === 'true' : dev;
  const enableEventProcessor = process.env.ENABLE_EVENT_PROCESSOR ? process.env.ENABLE_EVENT_PROCESSOR === 'true' : dev;
  return { dev, enableDocs, enableDevRoutes, enableEventProcessor };
}

exports.getRuntimeFlags = getRuntimeFlags;
