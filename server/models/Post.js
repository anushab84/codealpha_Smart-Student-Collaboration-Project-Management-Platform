const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  imageUrl: { type: String, default: '', maxlength: 2048 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [postCommentSchema],
  moderated: { type: Boolean, default: false }
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ content: 'text' });
module.exports = mongoose.model('Post', postSchema);
