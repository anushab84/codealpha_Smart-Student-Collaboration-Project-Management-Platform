const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  searchUsers
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

/**
 * User Profile Routes (Protected)
 */
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/search', protect, searchUsers);

module.exports = router;
