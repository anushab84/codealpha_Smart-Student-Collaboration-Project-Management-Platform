const User = require('../models/User');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search registered users by name or email
 * @route   GET /api/users/search?query=name_or_email
 * @access  Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(200).json({
        success: true,
        users: []
      });
    }

    const safeQuery = query.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(safeQuery, 'i');

    const users = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }]
    })
      .select('_id name email profileImage role bio')
      .limit(10);

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  searchUsers
};
