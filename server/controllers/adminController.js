const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Post = require('../models/Post');
const AdminAction = require('../models/AdminAction');

const record = (admin, action, targetType, target) => AdminAction.create({ admin, action, targetType, target });

exports.getAdminOverview = async (req, res, next) => {
  try {
    const now = new Date(); const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [users, activeUsers, projects, tasks, posts, recentUsers, recentProjects, recentTasks, recentPosts, recentAdminActions] = await Promise.all([
      User.countDocuments(), User.countDocuments({ isActive: { $ne: false } }), Project.countDocuments(), Task.countDocuments(), Post.countDocuments(),
      User.countDocuments({ createdAt: { $gte: since } }), Project.countDocuments({ createdAt: { $gte: since } }), Task.countDocuments({ createdAt: { $gte: since } }), Post.countDocuments({ createdAt: { $gte: since } }),
      AdminAction.find().populate('admin', 'name email').sort({ createdAt: -1 }).limit(20)
    ]);
    res.json({ success: true, stats: { users, activeUsers, projects, tasks, posts, recent: { users: recentUsers, projects: recentProjects, tasks: recentTasks, posts: recentPosts }, recentAdminActions } });
  } catch (error) { next(error); }
};

exports.listAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const filter = search ? { $or: [{ name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] } : {};
    const [users, total] = await Promise.all([User.find(filter).select('name email role isActive createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
    res.json({ success: true, users, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) { next(error); }
};

exports.setUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    if (id === req.user._id.toString() && !req.body.isActive) return res.status(400).json({ success: false, message: 'You cannot suspend your own administrator account' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!req.body.isActive && user.role === 'admin' && user.isActive) {
      const activeAdmins = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (activeAdmins <= 1) return res.status(409).json({ success: false, message: 'The last active administrator cannot be suspended' });
    }
    user.isActive = req.body.isActive; await user.save();
    if (!user.isActive) req.app.get('io')?.in(`user:${user._id}`).disconnectSockets(true);
    await record(req.user._id, req.body.isActive ? 'reactivate-user' : 'suspend-user', 'User', user._id);
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (error) { next(error); }
};

exports.listAdminPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [posts, total] = await Promise.all([Post.find().populate('author', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Post.countDocuments()]);
    res.json({ success: true, posts, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) { next(error); }
};

exports.moderatePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return res.status(400).json({ success: false, message: 'Invalid post ID' });
    if (typeof req.body.moderated !== 'boolean') return res.status(400).json({ success: false, message: 'moderated must be a boolean' });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.moderated = req.body.moderated; await post.save();
    await record(req.user._id, req.body.moderated ? 'hide-post' : 'restore-post', 'Post', post._id);
    res.json({ success: true, post: { _id: post._id, moderated: post.moderated } });
  } catch (error) { next(error); }
};
