const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 80 },
  targetType: { type: String, enum: ['User', 'Post'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

adminActionSchema.index({ createdAt: -1 });
module.exports = mongoose.model('AdminAction', adminActionSchema);
