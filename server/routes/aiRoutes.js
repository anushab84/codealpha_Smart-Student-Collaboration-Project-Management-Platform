const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { askProjectAssistant } = require('../controllers/aiController');

router.post('/projects/:projectId/assistant', protect, askProjectAssistant);
module.exports = router;
