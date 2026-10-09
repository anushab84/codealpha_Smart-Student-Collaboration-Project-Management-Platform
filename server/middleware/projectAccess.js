const mongoose = require('mongoose');
const Project = require('../models/Project');

async function getProjectAccess(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return { status: 400, message: 'Invalid Project ID format' };
  const project = await Project.findById(projectId);
  if (!project) return { status: 404, message: 'Project not found' };
  const id = userId.toString();
  const isOwner = project.owner.toString() === id;
  const isMember = project.members.some((member) => member.user.toString() === id);
  if (!isOwner && !isMember) return { status: 403, message: 'You are not authorized to access this project' };
  return { project, isOwner, isMember };
}

module.exports = { getProjectAccess };
