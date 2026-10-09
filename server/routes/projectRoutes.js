const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getDashboardSummary
} = require('../controllers/projectController');
const {
  createTask,
  getProjectTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const collaboration = require('../controllers/collaborationController');
const { getProjectMessages } = require('../controllers/messageController');
const meetings = require('../controllers/meetingController');
const { getProjectBoard } = require('../controllers/boardController');

// All project routes require authentication
router.use(protect);

// Dashboard summary stats
router.get('/summary', getDashboardSummary);

// Base project endpoints
router.route('/')
  .post(createProject)
  .get(getProjects);

// Specific project endpoints
router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// Team management endpoints
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:userId', removeProjectMember);

// Project files are stored outside the public web root. Uploads use a bounded
// application/octet-stream request body so the server can validate file bytes.
const uploadLimit = Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;
router.post('/:projectId/files', require('express').raw({ type: 'application/octet-stream', limit: uploadLimit }), collaboration.uploadProjectFile);
router.get('/:projectId/files', collaboration.listProjectFiles);
router.get('/:projectId/files/:fileId/download', collaboration.downloadProjectFile);
router.delete('/:projectId/files/:fileId', collaboration.deleteProjectFile);
router.get('/:projectId/messages', getProjectMessages);
router.get('/:projectId/meeting', meetings.getMeeting);
router.post('/:projectId/meeting', meetings.startMeeting);
router.post('/:projectId/meeting/:meetingId/token', meetings.getMeetingToken);
router.delete('/:projectId/meeting/:meetingId', meetings.endMeeting);
router.get('/:projectId/board', getProjectBoard);

// Task management endpoints for project
router.route('/:projectId/tasks')
  .get(getProjectTasks)
  .post(createTask);

module.exports = router;
