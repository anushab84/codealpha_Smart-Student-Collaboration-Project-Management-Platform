const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.listNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const notifications = await Notification.find({ recipient: req.user._id }).populate('actor', 'name profileImage').populate('project', 'title').sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, notifications });
  } catch (error) { next(error); }
};

exports.getUnreadCount = async (req, res, next) => {
  try { const count = await Notification.countDocuments({ recipient: req.user._id, read: false }); res.json({ success: true, count }); }
  catch (error) { next(error); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true }).populate('actor', 'name profileImage').populate('project', 'title');
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) { next(error); }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try { const result = await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } }); res.json({ success: true, modifiedCount: result.modifiedCount }); }
  catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    const result = await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true });
  } catch (error) { next(error); }
};
