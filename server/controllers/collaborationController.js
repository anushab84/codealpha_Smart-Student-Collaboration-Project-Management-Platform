const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ProjectFile = require('../models/ProjectFile');
const { getProjectAccess } = require('../middleware/projectAccess');
const { validateFileContent } = require('../utils/fileValidation');

const sendError = (res, status, message) => res.status(status).json({ success: false, message });
const uploadRoot = path.resolve(process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '..', 'private-uploads'));
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;
const mimeExtensions = { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'], 'image/webp': ['.webp'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] };

async function taskAndAccess(taskId, userId) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) return { status: 400, message: 'Invalid Task ID format' };
  const task = await Task.findById(taskId);
  if (!task) return { status: 404, message: 'Task not found' };
  const access = await getProjectAccess(task.project, userId);
  return access.status ? access : { task, ...access };
}

exports.listTaskComments = async (req, res, next) => {
  try {
    const result = await taskAndAccess(req.params.taskId, req.user._id);
    if (result.status) return sendError(res, result.status, result.message);
    const comments = await Comment.find({ task: result.task._id }).populate('author', 'name profileImage').sort({ createdAt: 1 }).limit(500);
    res.json({ success: true, comments });
  } catch (error) { next(error); }
};

exports.createTaskComment = async (req, res, next) => {
  try {
    const result = await taskAndAccess(req.params.taskId, req.user._id);
    if (result.status) return sendError(res, result.status, result.message);
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 5000) return sendError(res, 400, 'Comment must contain 1 to 5000 characters');
    const comment = await Comment.create({ task: result.task._id, project: result.project._id, author: req.user._id, content });
    await comment.populate('author', 'name profileImage');
    res.status(201).json({ success: true, comment });
  } catch (error) { next(error); }
};

async function ownedComment(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) { sendError(res, 400, 'Invalid Comment ID format'); return null; }
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) { sendError(res, 404, 'Comment not found'); return null; }
  const access = await getProjectAccess(comment.project, req.user._id);
  if (access.status) { sendError(res, access.status, access.message); return null; }
  if (comment.author.toString() !== req.user._id.toString()) { sendError(res, 403, 'Only the comment author may edit or delete it'); return null; }
  return comment;
}

exports.updateTaskComment = async (req, res, next) => {
  try {
    const comment = await ownedComment(req, res);
    if (!comment) return;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 5000) return sendError(res, 400, 'Comment must contain 1 to 5000 characters');
    comment.content = content;
    await comment.save();
    await comment.populate('author', 'name profileImage');
    res.json({ success: true, comment });
  } catch (error) { next(error); }
};

exports.deleteTaskComment = async (req, res, next) => {
  try {
    const comment = await ownedComment(req, res);
    if (!comment) return;
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) { next(error); }
};

exports.uploadProjectFile = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return sendError(res, access.status, access.message);
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return sendError(res, 400, 'Select a file to upload');
    if (buffer.length > maxUploadBytes) return sendError(res, 413, `File exceeds the ${Math.floor(maxUploadBytes / 1048576)} MB upload limit`);
    const mimeType = req.headers['x-file-content-type'];
    let decodedName = req.headers['x-file-name'] || 'upload';
    try { decodedName = decodeURIComponent(decodedName); } catch { return sendError(res, 400, 'Invalid filename encoding'); }
    const originalFilename = path.basename(decodedName).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
    const ext = path.extname(originalFilename).toLowerCase();
    if (!mimeExtensions[mimeType]?.includes(ext)) return sendError(res, 415, 'File extension and content type are not an approved combination');
    if (!validateFileContent(mimeType, ext, buffer)) return sendError(res, 415, 'File content does not match an approved format');
    await fs.promises.mkdir(uploadRoot, { recursive: true });
    const storageKey = `${crypto.randomUUID()}${ext}`;
    await fs.promises.writeFile(path.join(uploadRoot, storageKey), buffer, { flag: 'wx', mode: 0o600 });
    try {
      const file = await ProjectFile.create({ project: access.project._id, uploader: req.user._id, originalFilename, storageKey, mimeType, fileSize: buffer.length });
      await file.populate('uploader', 'name profileImage');
      res.status(201).json({ success: true, file });
    } catch (error) { await fs.promises.unlink(path.join(uploadRoot, storageKey)).catch(() => {}); throw error; }
  } catch (error) { next(error); }
};

exports.listProjectFiles = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return sendError(res, access.status, access.message);
    const files = await ProjectFile.find({ project: access.project._id }).populate('uploader', 'name profileImage').sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, files });
  } catch (error) { next(error); }
};

exports.downloadProjectFile = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return sendError(res, access.status, access.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) return sendError(res, 400, 'Invalid file ID');
    const file = await ProjectFile.findOne({ _id: req.params.fileId, project: access.project._id });
    if (!file) return sendError(res, 404, 'File not found');
    const fullPath = path.join(uploadRoot, path.basename(file.storageKey));
    res.set({ 'Content-Type': file.mimeType, 'Content-Length': file.fileSize, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}` });
    res.sendFile(fullPath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { next(error); }
};

exports.deleteProjectFile = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return sendError(res, access.status, access.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) return sendError(res, 400, 'Invalid file ID');
    const file = await ProjectFile.findOne({ _id: req.params.fileId, project: access.project._id });
    if (!file) return sendError(res, 404, 'File not found');
    if (!access.isOwner && file.uploader.toString() !== req.user._id.toString()) return sendError(res, 403, 'Only the uploader or project owner may delete this file');
    await file.deleteOne();
    await fs.promises.unlink(path.join(uploadRoot, path.basename(file.storageKey))).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    res.json({ success: true, message: 'File deleted' });
  } catch (error) { next(error); }
};
