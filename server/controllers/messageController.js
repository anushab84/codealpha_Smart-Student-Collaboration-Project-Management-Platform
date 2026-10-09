const mongoose = require('mongoose');
const Message = require('../models/Message');
const { getProjectAccess } = require('../middleware/projectAccess');

exports.getProjectMessages = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const query = { project: access.project._id };
    if (req.query.beforeId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.beforeId)) return res.status(400).json({ success: false, message: 'Invalid message cursor' });
      const cursor = await Message.findOne({ _id: req.query.beforeId, project: access.project._id }).select('_id createdAt');
      if (!cursor) return res.status(400).json({ success: false, message: 'Message cursor does not belong to this project' });
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor._id } }
      ];
    } else if (req.query.before) {
      const before = new Date(req.query.before);
      if (Number.isNaN(before.getTime())) return res.status(400).json({ success: false, message: 'Invalid before cursor' });
      query.createdAt = { $lt: before };
    }
    const messages = await Message.find(query).populate('sender', 'name profileImage').sort({ createdAt: -1, _id: -1 }).limit(limit);
    res.json({ success: true, messages: messages.reverse(), hasMore: messages.length === limit });
  } catch (error) { next(error); }
};
