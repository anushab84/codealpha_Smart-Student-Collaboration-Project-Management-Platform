const mongoose = require('mongoose');

const projectMeetingSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  roomName: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true },
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

projectMeetingSchema.index({ project: 1 }, { unique: true, partialFilterExpression: { active: true } });
module.exports = mongoose.model('ProjectMeeting', projectMeetingSchema);
