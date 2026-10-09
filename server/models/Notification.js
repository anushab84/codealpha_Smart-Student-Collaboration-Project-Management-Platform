const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['ProjectMemberAdded', 'ProjectMemberRemoved', 'TaskAssigned'], required: true },
  relatedResource: { type: mongoose.Schema.Types.ObjectId, required: true },
  relatedType: { type: String, enum: ['Project', 'Task'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
