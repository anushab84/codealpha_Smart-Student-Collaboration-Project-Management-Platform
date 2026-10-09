const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const ProjectBoard = require('../models/ProjectBoard');
const { getProjectAccess } = require('../middleware/projectAccess');

function validateBoardItems(items) {
  if (!Array.isArray(items) || items.length > 1000 || Buffer.byteLength(JSON.stringify(items), 'utf8') > 750000) return null;
  const validPoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
  const clean = [];
  for (const item of items) {
    if (!item || !['stroke', 'rect', 'ellipse', 'text'].includes(item.type) || typeof item.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(item.color)) return null;
    const width = Number(item.width);
    if (!Number.isFinite(width) || width < 1 || width > 30) return null;
    if (item.type === 'stroke') {
      if (!Array.isArray(item.points) || item.points.length < 1 || item.points.length > 1000 || !item.points.every(validPoint)) return null;
      clean.push({ type: 'stroke', points: item.points.map((point) => ({ x: point.x, y: point.y })), color: item.color, width });
    } else if (item.type === 'text') {
      if (!validPoint(item) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 500) return null;
      clean.push({ type: 'text', x: item.x, y: item.y, text: item.text.trim(), color: item.color, width });
    } else {
      if (!validPoint(item) || !Number.isFinite(item.w) || !Number.isFinite(item.h) || item.w < 0 || item.h < 0 || item.x + item.w > 1 || item.y + item.h > 1) return null;
      clean.push({ type: item.type, x: item.x, y: item.y, w: item.w, h: item.h, color: item.color, width });
    }
  }
  return clean;
}

const initSocket = (httpServer) => {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((value) => value.trim());
  const io = new Server(httpServer, { cors: { origin: origins, methods: ['GET', 'POST'] }, maxHttpBufferSize: 1_000_000 });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name profileImage isActive');
      if (!user || !user.isActive) return next(new Error('Account not found or suspended'));
      socket.data.user = user;
      next();
    } catch (error) { next(new Error('Invalid or expired authentication token')); }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user._id}`);
    const recentSends = [];
    socket.on('project:join', async (payload = {}, acknowledge = () => {}) => {
      try {
        const projectId = payload.projectId;
        if (!mongoose.Types.ObjectId.isValid(projectId)) return acknowledge({ success: false, message: 'Invalid project ID' });
        const access = await getProjectAccess(projectId, user._id);
        if (access.status) return acknowledge({ success: false, message: access.message });
        await socket.join(`project:${projectId}`);
        acknowledge({ success: true, projectId: access.project._id.toString() });
      } catch { acknowledge({ success: false, message: 'Could not join project chat' }); }
    });

    socket.on('project:leave', async (payload = {}, acknowledge = () => {}) => {
      if (mongoose.Types.ObjectId.isValid(payload.projectId)) await socket.leave(`project:${payload.projectId}`);
      acknowledge({ success: true });
    });

    socket.on('project:send-message', async (payload = {}, acknowledge = () => {}) => {
      try {
        const projectId = payload.projectId;
        const text = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!mongoose.Types.ObjectId.isValid(projectId)) return acknowledge({ success: false, message: 'Invalid project ID' });
        if (!text || text.length > 2000) return acknowledge({ success: false, message: 'Messages must contain 1 to 2000 characters' });
        if (!socket.rooms.has(`project:${projectId}`)) return acknowledge({ success: false, message: 'Join the project chat before sending messages' });
        const now = Date.now();
        while (recentSends.length && now - recentSends[0] > 10000) recentSends.shift();
        if (recentSends.length >= 20) return acknowledge({ success: false, message: 'You are sending messages too quickly' });
        const access = await getProjectAccess(projectId, user._id);
        if (access.status) { await socket.leave(`project:${projectId}`); return acknowledge({ success: false, message: access.message }); }
        recentSends.push(now);
        const message = await Message.create({ project: access.project._id, sender: user._id, text });
        await message.populate('sender', 'name profileImage');
        const payloadOut = { message };
        io.to(`project:${projectId}`).emit('project:message', payloadOut);
        acknowledge({ success: true, message });
      } catch { acknowledge({ success: false, message: 'Message could not be saved' }); }
    });

    socket.on('board:join', async (payload = {}, acknowledge = () => {}) => {
      try {
        const projectId = payload.projectId;
        if (!mongoose.Types.ObjectId.isValid(projectId)) return acknowledge({ success: false, message: 'Invalid project ID' });
        const access = await getProjectAccess(projectId, user._id);
        if (access.status) return acknowledge({ success: false, message: access.message });
        const board = await ProjectBoard.findOne({ project: access.project._id }).select('items updatedAt');
        await socket.join(`board:${projectId}`);
        acknowledge({ success: true, items: board?.items || [], updatedAt: board?.updatedAt || null });
      } catch { acknowledge({ success: false, message: 'Could not load the project board' }); }
    });

    socket.on('board:leave', async (payload = {}, acknowledge = () => {}) => {
      if (mongoose.Types.ObjectId.isValid(payload.projectId)) await socket.leave(`board:${payload.projectId}`);
      acknowledge({ success: true });
    });

    socket.on('board:update', async (payload = {}, acknowledge = () => {}) => {
      try {
        const projectId = payload.projectId;
        if (!mongoose.Types.ObjectId.isValid(projectId)) return acknowledge({ success: false, message: 'Invalid project ID' });
        if (!socket.rooms.has(`board:${projectId}`)) return acknowledge({ success: false, message: 'Join the project board before editing' });
        const access = await getProjectAccess(projectId, user._id);
        if (access.status) { await socket.leave(`board:${projectId}`); return acknowledge({ success: false, message: access.message }); }
        const items = validateBoardItems(payload.items);
        if (!items) return acknowledge({ success: false, message: 'Board data is invalid or too large' });
        const board = await ProjectBoard.findOneAndUpdate({ project: access.project._id }, { $set: { items, updatedBy: user._id } }, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
        const update = { projectId, items: board.items, updatedAt: board.updatedAt, updatedBy: user._id.toString() };
        io.to(`board:${projectId}`).emit('project:board-updated', update);
        acknowledge({ success: true, updatedAt: board.updatedAt });
      } catch { acknowledge({ success: false, message: 'Board changes could not be saved' }); }
    });
  });

  return io;
};

module.exports = initSocket;
module.exports.validateBoardItems = validateBoardItems;
