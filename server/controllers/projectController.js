const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, status, startDate, dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide project title and description'
      });
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Due date cannot be earlier than the start date'
      });
    }

    // Create project assigning current user as owner
    const project = await Project.create({
      title,
      description,
      status: status || 'Planning',
      startDate: startDate || Date.now(),
      dueDate: dueDate || null,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'Owner'
        }
      ]
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email profileImage role')
      .populate('members.user', 'name email profileImage role');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all projects for the authenticated user (Owned or Member)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    })
      .populate('owner', 'name email profileImage')
      .populate('members.user', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project details by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Project ID format'
      });
    }

    const project = await Project.findById(id)
      .populate('owner', 'name email profileImage role bio')
      .populate('members.user', 'name email profileImage role bio');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization: User must be owner or member of the project
    const userIdStr = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userIdStr;
    const isMember = project.members.some(
      (m) => m.user._id.toString() === userIdStr
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this project'
      });
    }

    return res.status(200).json({
      success: true,
      project,
      isOwner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private (Owner/Manager)
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Project ID format'
      });
    }

    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization: Only owner can update project settings
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the project owner can update project details'
      });
    }

    const { title, description, status, startDate, dueDate } = req.body;

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Due date cannot be earlier than the start date'
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email profileImage role')
      .populate('members.user', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Project ID format'
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization: Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the project owner can delete this project'
      });
    }

    await project.deleteOne();
    req.app.get('io')?.in(`project:${id}`).socketsLeave(`project:${id}`);
    req.app.get('io')?.in(`board:${id}`).socketsLeave(`board:${id}`);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a registered user to project team
 * @route   POST /api/projects/:id/members
 * @access  Private (Owner only)
 */
const addProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Project or User ID format'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can manage members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the project owner can add team members'
      });
    }

    // Verify user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to add not found in system'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(
      (m) => m.user.toString() === userId.toString()
    );

    if (isAlreadyMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    project.members.push({
      user: userId,
      role: role || 'Member'
    });

    await project.save();

    await createNotification({ app: req.app, recipient: targetUser._id, actor: req.user._id, type: 'ProjectMemberAdded', relatedResource: project._id, relatedType: 'Project', project: project._id, message: `You were added to ${project.title}` }).catch((error) => console.error('Notification save failed:', error.message));

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email profileImage role')
      .populate('members.user', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: `${targetUser.name} added to project team successfully`,
      project: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a team member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (Owner only)
 */
const removeProjectMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Project or User ID format'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can remove members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the project owner can remove team members'
      });
    }

    // Cannot remove project owner
    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner from the team'
      });
    }

    // Filter out target user
    const initialLength = project.members.length;
    project.members = project.members.filter(
      (m) => m.user.toString() !== userId.toString()
    );

    if (project.members.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project'
      });
    }

    await project.save();

    const io = req.app.get('io');
    io?.in(`user:${userId}`).socketsLeave(`project:${id}`);
    io?.in(`user:${userId}`).socketsLeave(`board:${id}`);

    const removedUser = await User.findById(userId).select('_id');
    if (removedUser) await createNotification({ app: req.app, recipient: removedUser._id, actor: req.user._id, type: 'ProjectMemberRemoved', relatedResource: project._id, relatedType: 'Project', project: project._id, message: `You were removed from ${project.title}` }).catch((error) => console.error('Notification save failed:', error.message));

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email profileImage role')
      .populate('members.user', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      project: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary metrics for user's projects
 * @route   GET /api/projects/summary
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    })
      .populate('owner', 'name email profileImage')
      .populate('members.user', 'name email profileImage')
      .sort({ createdAt: -1 });

    const totalProjects = userProjects.length;
    const activeCount = userProjects.filter((p) => p.status === 'Active').length;
    const planningCount = userProjects.filter((p) => p.status === 'Planning').length;
    const completedCount = userProjects.filter((p) => p.status === 'Completed').length;
    const archivedCount = userProjects.filter((p) => p.status === 'Archived').length;

    const recentProjects = userProjects.slice(0, 5);

    return res.status(200).json({
      success: true,
      summary: {
        totalProjects,
        activeCount,
        planningCount,
        completedCount,
        archivedCount
      },
      recentProjects
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getDashboardSummary
};
