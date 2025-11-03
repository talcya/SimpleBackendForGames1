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
