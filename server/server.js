const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const validateConfig = require('./config/validateConfig');
const initSocket = require('./socket/socketHandler');
const { createRateLimit } = require('./middleware/rateLimit');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const postRoutes = require('./routes/postRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((value) => value.trim()).filter(Boolean);
const app = express();
if (process.env.TRUST_PROXY_HOPS && Number(process.env.TRUST_PROXY_HOPS) > 0) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
const httpServer = http.createServer(app);
const io = initSocket(httpServer);
app.set('io', io);

app.disable('x-powered-by');
app.use((req, res, next) => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
  };
  if (process.env.NODE_ENV === 'production') headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  res.set(headers);
  next();
});
app.use(cors({
  origin(origin, callback) { callback(null, !origin || allowedOrigins.includes(origin)); },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-File-Name', 'X-File-Content-Type'],
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', createRateLimit({ windowMs: 60_000, max: 180, keyPrefix: 'api' }));
app.use('/api/auth/login', createRateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: 'login', message: 'Too many login attempts. Try again in 15 minutes.' }));
app.use('/api/auth/register', createRateLimit({ windowMs: 60 * 60_000, max: 10, keyPrefix: 'register', message: 'Too many registration attempts. Try again later.' }));

app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Welcome to CollabHub API' }));
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', discoveryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  validateConfig();
  const connected = await connectDB();
  if (!connected) throw new Error('MongoDB connection failed; refusing to start the API without a database.');
  const port = Number(process.env.PORT) || 5000;
  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, () => { httpServer.removeListener('error', reject); console.log(`[Server] CollabHub API listening on port ${port}`); resolve(); });
  });
  return httpServer;
}

if (require.main === module) {
  start().catch((error) => { console.error(`[Startup Error] ${error.message}`); process.exitCode = 1; });
  const shutdown = () => {
    httpServer.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { app, httpServer, start };
