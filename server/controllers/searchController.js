const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Post = require('../models/Post');

const TYPES = ['projects', 'tasks', 'users', 'posts'];

exports.search = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2 || q.length > 100 || /[\u0000-\u001f\u007f]/.test(q)) return res.status(400).json({ success: false, message: 'Search must contain 2 to 100 printable characters' });
    const requestedType = req.query.type;
    if (requestedType && !TYPES.includes(requestedType)) return res.status(400).json({ success: false, message: 'Invalid search category' });
    const projectDocs = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id');
    const projectIds = projectDocs.map((project) => project._id);
    const textQuery = { $text: { $search: q } };
    const results = {};
    const queries = {
      projects: () => Project.find({ _id: { $in: projectIds }, ...textQuery }).select('title description status owner').limit(10),
      tasks: () => Task.find({ project: { $in: projectIds }, ...textQuery }).select('title description status priority dueDate project').populate('project', 'title').limit(10),
      users: () => User.find(textQuery).select('name profileImage').limit(10),
      posts: () => Post.find({ moderated: false, ...textQuery }).select('content imageUrl author createdAt').populate('author', 'name profileImage').limit(10)
    };
    for (const type of TYPES) {
      if (!requestedType || requestedType === type) results[type] = await queries[type]();
    }
    res.json({ success: true, query: q, results });
  } catch (err) { next(err); }
};

exports.calendarTasks = async (req, res, next) => {
  try {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    if (!req.query.from || !req.query.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from || to - from > 184 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Provide a valid date range of up to 184 days' });
    }
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id');
    const tasks = await Task.find({ project: { $in: projects.map((project) => project._id) }, dueDate: { $gte: from, $lt: to } }).select('title status priority dueDate project assignedTo').populate('project', 'title').populate('assignedTo', 'name').sort({ dueDate: 1 }).limit(1000);
    res.json({ success: true, tasks, truncated: tasks.length === 1000 });
  } catch (err) { next(err); }
};
