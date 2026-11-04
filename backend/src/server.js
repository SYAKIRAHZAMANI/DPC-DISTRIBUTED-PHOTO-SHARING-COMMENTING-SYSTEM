import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import { applyObservability } from './middleware/observability.js';
import { notFound, errorHandler } from './middleware/error.js';
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
applyObservability(app);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.get('/api/health', (req, res) => {
  const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({
    status: db === 'connected' ? 'ok' : 'degraded', service: 'Moments API', database: db,
    instance: os.hostname(), uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1048576), time: new Date().toISOString()
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/groups', groupRoutes);
app.use(notFound);
app.use(errorHandler);
const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`Moments API running on http://localhost:${port}`))).catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
