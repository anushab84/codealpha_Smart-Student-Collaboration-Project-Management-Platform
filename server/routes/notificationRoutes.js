const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notifications = require('../controllers/notificationController');

router.use(protect);
router.get('/', notifications.listNotifications);
router.get('/unread-count', notifications.getUnreadCount);
router.patch('/read-all', notifications.markAllNotificationsRead);
router.patch('/:id/read', notifications.markNotificationRead);
router.delete('/:id', notifications.deleteNotification);
module.exports = router;
