const mongoose = require('mongoose');

const projectFileSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFilename: { type: String, required: true, maxlength: 255 },
  storageKey: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1 }
}, { timestamps: true });

projectFileSchema.index({ project: 1, createdAt: -1 });
module.exports = mongoose.model('ProjectFile', projectFileSchema);
