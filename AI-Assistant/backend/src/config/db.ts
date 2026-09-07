import mongoose from 'mongoose';
import { config } from '../config/index.js';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

  if (!config.mongoUri) {
    console.warn('[Database] MONGODB_URI is not set. Persistent file-backed storage fallback will be utilized seamlessly.');
    return false;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', (error as Error).message);
    console.warn('[Database] Falling back to robust local persistent store.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
