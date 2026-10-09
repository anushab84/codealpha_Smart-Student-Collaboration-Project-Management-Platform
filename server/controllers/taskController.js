const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const createNotification = require('../utils/createNotification');

/**
 * Helper function to verify user belongs to project
 */
const verifyProjectAccess = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return { error: 'Invalid Project ID format', status: 400 };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }

  const userIdStr = userId.toString();
  const isOwner = project.owner.toString() === userIdStr;
  const isMember = project.members.some(
    (m) => m.user.toString() === userIdStr
  );

  if (!isOwner && !isMember) {
    return { error: 'Forbidden: You are not authorized to access tasks for this project', status: 403 };
  }

  return { project, isOwner, isMember };
};

/**
 * @desc    Create a new task inside a project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    // Verify user belongs to project
    const access = await verifyProjectAccess(projectId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a task title'
      });
    }

    let validAssignee = null;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      // Ensure assigned user is a member of the project
      const projectMembers = access.project.members.map((m) => m.user.toString());
      if (!projectMembers.includes(assignedTo.toString()) && access.project.owner.toString() !== assignedTo.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a member of this project'
        });
      }
      validAssignee = assignedTo;
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      project: projectId,
      assignedTo: validAssignee,
      createdBy: req.user._id,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email profileImage role')
      .populate('createdBy', 'name email profileImage role');

    if (validAssignee) await createNotification({ app: req.app, recipient: validAssignee, actor: req.user._id, type: 'TaskAssigned', relatedResource: task._id, relatedType: 'Task', project: projectId, message: `You were assigned to ${task.title}` }).catch((error) => console.error('Notification save failed:', error.message));

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private
 */
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const access = await verifyProjectAccess(projectId, req.user._id);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email profileImage role')
      .populate('createdBy', 'name email profileImage role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get individual task details
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format'
      });
    }

    const task = await Task.findById(id)
      .populate('project', 'title status owner members')
      .populate('assignedTo', 'name email profileImage role')
      .populate('createdBy', 'name email profileImage role');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify user belongs to task's project
    const access = await verifyProjectAccess(task.project._id, req.user._id);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details (Status, Priority, Assignee, Title, Description, Due Date)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format'
      });
    }

    let task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify user belongs to task's project
    const access = await verifyProjectAccess(task.project, req.user._id);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    const { title, description, assignedTo, priority, status, dueDate } = req.body;
    const previousAssignee = task.assignedTo?.toString() || null;

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        task.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        const projectMembers = access.project.members.map((m) => m.user.toString());
        if (!projectMembers.includes(assignedTo.toString()) && access.project.owner.toString() !== assignedTo.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a member of this project'
          });
        }
        task.assignedTo = assignedTo;
      }
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'name email profileImage role')
      .populate('createdBy', 'name email profileImage role');

    if (task.assignedTo && task.assignedTo.toString() !== previousAssignee) await createNotification({ app: req.app, recipient: task.assignedTo, actor: req.user._id, type: 'TaskAssigned', relatedResource: task._id, relatedType: 'Task', project: task.project, message: `You were assigned to ${task.title}` }).catch((error) => console.error('Notification save failed:', error.message));

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task (Project owner or Task creator only)
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Task ID format'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify user belongs to project
    const access = await verifyProjectAccess(task.project, req.user._id);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    // Authorization: Only project owner OR task creator can delete task
    const userIdStr = req.user._id.toString();
    const isOwner = access.isOwner;
    const isCreator = task.createdBy.toString() === userIdStr;

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the project owner or task creator can delete this task'
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get global task summary metrics for dashboard
 * @route   GET /api/tasks/summary
 * @access  Private
 */
const getDashboardTaskSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all projects user belongs to
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } });

    const totalTasks = tasks.length;
    const todoCount = tasks.filter((t) => t.status === 'Todo').length;
    const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
    const reviewCount = tasks.filter((t) => t.status === 'Review').length;
    const completedCount = tasks.filter((t) => t.status === 'Completed').length;

    const assignedToMeCount = tasks.filter(
      (t) => t.assignedTo && t.assignedTo.toString() === userId.toString()
    ).length;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const dueSoonCount = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Completed') return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= sevenDaysFromNow;
    }).length;

    return res.status(200).json({
      success: true,
      summary: {
        totalTasks,
        todoCount,
        inProgressCount,
        reviewCount,
        completedCount,
        assignedToMeCount,
        dueSoonCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardTaskSummary
};
