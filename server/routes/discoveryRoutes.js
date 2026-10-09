const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { search, calendarTasks } = require('../controllers/searchController');

router.use(protect);
router.get('/search', search);
router.get('/calendar', calendarTasks);
module.exports = router;
