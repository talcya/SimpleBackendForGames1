import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gameDB',
  jwtSecret: process.env.JWT_SECRET || 'change-me-please',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export async function connectMongo() {
  if (!config.mongoUri) throw new Error('MONGO_URI not configured');
  await mongoose.connect(config.mongoUri, { dbName: 'gameDB' });
  return mongoose.connection;
}
