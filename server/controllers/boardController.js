const { getProjectAccess } = require('../middleware/projectAccess');
const ProjectBoard = require('../models/ProjectBoard');

exports.getProjectBoard = async (req, res, next) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user._id);
    if (access.status) return res.status(access.status).json({ success: false, message: access.message });
    const board = await ProjectBoard.findOne({ project: access.project._id }).select('items updatedAt updatedBy');
    res.json({ success: true, items: board?.items || [], updatedAt: board?.updatedAt || null });
  } catch (error) { next(error); }
};
