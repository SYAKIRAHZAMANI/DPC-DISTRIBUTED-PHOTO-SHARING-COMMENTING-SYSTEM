import mongoose from 'mongoose';

export async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Configure backend/.env');
  // A pool of reusable connections lets many concurrent requests query the DB in parallel
  // instead of queueing behind a single connection.
  await mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 20 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
