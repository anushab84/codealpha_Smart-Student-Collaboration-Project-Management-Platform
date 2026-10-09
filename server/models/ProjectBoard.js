const mongoose = require('mongoose');

const projectBoardSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('ProjectBoard', projectBoardSchema);
