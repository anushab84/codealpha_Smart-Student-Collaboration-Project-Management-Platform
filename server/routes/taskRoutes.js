const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardTaskSummary
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const collaboration = require('../controllers/collaborationController');

// All task routes require authentication
router.use(protect);

// Global dashboard task metrics summary
// GET /api/tasks/summary
router.get('/summary', getDashboardTaskSummary);
router.get('/:taskId/comments', collaboration.listTaskComments);
router.post('/:taskId/comments', collaboration.createTaskComment);

// Direct single task endpoints (/api/tasks/:id)
// GET  /api/tasks/:id       → Get individual task details
// PUT  /api/tasks/:id       → Update task
// DELETE /api/tasks/:id     → Delete task
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
