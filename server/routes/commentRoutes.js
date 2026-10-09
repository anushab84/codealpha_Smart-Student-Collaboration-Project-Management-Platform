const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateTaskComment, deleteTaskComment } = require('../controllers/collaborationController');

router.use(protect);
router.route('/:commentId').put(updateTaskComment).delete(deleteTaskComment);
module.exports = router;
