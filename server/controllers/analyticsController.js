const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ $or: [{ owner: userId }, { 'members.user': userId }] }).select('_id title status owner');
    const accessibleIds = projects.map((project) => project._id);
    let selectedProject = null;
    if (req.query.projectId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) return res.status(400).json({ success: false, message: 'Invalid project ID' });
      selectedProject = projects.find((project) => project._id.toString() === req.query.projectId);
      if (!selectedProject) return res.status(403).json({ success: false, message: 'You cannot view analytics for this project' });
    }
    const scopedProjectIds = selectedProject ? [selectedProject._id] : accessibleIds;
    const taskMatch = { project: { $in: scopedProjectIds } };
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [totalTasks, completed, inProgress, review, overdue, byStatus, byPriority, byAssignee, recentTaskCount, projectStats] = await Promise.all([
      Task.countDocuments(taskMatch),
      Task.countDocuments({ ...taskMatch, status: 'Completed' }),
      Task.countDocuments({ ...taskMatch, status: 'In Progress' }),
      Task.countDocuments({ ...taskMatch, status: 'Review' }),
      Task.countDocuments({ ...taskMatch, status: { $ne: 'Completed' }, dueDate: { $lt: now, $ne: null } }),
      Task.aggregate([{ $match: taskMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: taskMatch }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: taskMatch }, { $group: { _id: '$assignedTo', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]),
      Task.countDocuments({ ...taskMatch, createdAt: { $gte: recentCutoff } }),
      Task.aggregate([{ $match: { project: { $in: scopedProjectIds } } }, { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } }])
    ]);
    const assigneeIds = byAssignee.map((item) => item._id).filter(Boolean);
    const users = assigneeIds.length ? await User.find({ _id: { $in: assigneeIds } }).select('name') : [];
    const userNames = new Map(users.map((user) => [user._id.toString(), user.name]));
    const projectProgress = (selectedProject ? [selectedProject] : projects).map((project) => {
      const counts = projectStats.filter((item) => item._id.project.toString() === project._id.toString());
      const total = counts.reduce((sum, item) => sum + item.count, 0);
      const done = counts.find((item) => item._id.status === 'Completed')?.count || 0;
      return { _id: project._id, title: project.title, status: project.status, totalTasks: total, completedTasks: done, completionPercentage: total ? Math.round(done * 100 / total) : 0 };
    });
    res.json({ success: true, formula: 'completed tasks / total tasks * 100; an empty scope is 0%', summary: { totalProjects: projects.length, totalTasks, completed, inProgress, review, overdue, completionPercentage: totalTasks ? Math.round(completed * 100 / totalTasks) : 0, tasksCreatedLast30Days: recentTaskCount }, distributions: { status: byStatus, priority: byPriority, assignee: byAssignee.map((item) => ({ userId: item._id, name: item._id ? userNames.get(item._id.toString()) || 'Former member' : 'Unassigned', count: item.count })) }, projects: projectProgress, accessibleProjects: projects });
  } catch (error) { next(error); }
};
