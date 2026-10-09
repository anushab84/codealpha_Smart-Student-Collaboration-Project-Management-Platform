const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const admin = require('../controllers/adminController');

router.use(protect, authorizeAdmin);
router.get('/overview', admin.getAdminOverview);
router.get('/users', admin.listAdminUsers);
router.patch('/users/:id/status', admin.setUserStatus);
router.get('/posts', admin.listAdminPosts);
router.patch('/posts/:postId/moderation', admin.moderatePost);
module.exports = router;
