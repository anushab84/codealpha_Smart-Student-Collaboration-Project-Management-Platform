const mongoose = require('mongoose');
const Post = require('../models/Post');

const error = (res, status, message) => res.status(status).json({ success: false, message });
const validUrl = (value) => {
  if (!value) return true;
  try { const parsed = new URL(value); return ['https:', 'http:'].includes(parsed.protocol); } catch { return false; }
};

exports.listPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const [posts, total] = await Promise.all([
      Post.find({ moderated: false }).populate('author', 'name profileImage bio').populate('comments.author', 'name profileImage').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Post.countDocuments({ moderated: false })
    ]);
    res.json({ success: true, posts, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
};

exports.createPost = async (req, res, next) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    if (!content || content.length > 5000) return error(res, 400, 'Post text must contain 1 to 5000 characters');
    if (!validUrl(imageUrl)) return error(res, 400, 'Image URL must use HTTP or HTTPS');
    const post = await Post.create({ author: req.user._id, content, imageUrl });
    await post.populate('author', 'name profileImage bio');
    res.status(201).json({ success: true, post });
  } catch (err) { next(err); }
};

exports.getPost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return error(res, 400, 'Invalid post ID');
    const post = await Post.findOne({ _id: req.params.postId, moderated: false }).populate('author', 'name profileImage bio').populate('comments.author', 'name profileImage');
    if (!post) return error(res, 404, 'Post not found');
    res.json({ success: true, post });
  } catch (err) { next(err); }
};

exports.updatePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return error(res, 400, 'Invalid post ID');
    const post = await Post.findOne({ _id: req.params.postId, moderated: false });
    if (!post) return error(res, 404, 'Post not found');
    if (post.author.toString() !== req.user._id.toString()) return error(res, 403, 'Only the post author may edit it');
    if (req.body.content !== undefined) {
      if (typeof req.body.content !== 'string' || !req.body.content.trim() || req.body.content.trim().length > 5000) return error(res, 400, 'Post text must contain 1 to 5000 characters');
      post.content = req.body.content.trim();
    }
    if (req.body.imageUrl !== undefined) {
      const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
      if (!validUrl(imageUrl)) return error(res, 400, 'Image URL must use HTTP or HTTPS');
      post.imageUrl = imageUrl;
    }
    await post.save(); await post.populate('author', 'name profileImage bio');
    res.json({ success: true, post });
  } catch (err) { next(err); }
};

exports.deletePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return error(res, 400, 'Invalid post ID');
    const post = await Post.findById(req.params.postId);
    if (!post) return error(res, 404, 'Post not found');
    if (post.author.toString() !== req.user._id.toString()) return error(res, 403, 'Only the post author may delete it');
    await post.deleteOne(); res.json({ success: true });
  } catch (err) { next(err); }
};

exports.toggleLike = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return error(res, 400, 'Invalid post ID');
    const post = await Post.findOne({ _id: req.params.postId, moderated: false });
    if (!post) return error(res, 404, 'Post not found');
    const liked = post.likes.some((id) => id.toString() === req.user._id.toString());
    const update = liked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } };
    const updated = await Post.findByIdAndUpdate(post._id, update, { new: true }).select('likes');
    res.json({ success: true, liked: !liked, likes: updated.likes });
  } catch (err) { next(err); }
};

exports.addPostComment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return error(res, 400, 'Invalid post ID');
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 2000) return error(res, 400, 'Comment must contain 1 to 2000 characters');
    const post = await Post.findOne({ _id: req.params.postId, moderated: false });
    if (!post) return error(res, 404, 'Post not found');
    post.comments.push({ author: req.user._id, content }); await post.save();
    const comment = post.comments[post.comments.length - 1]; await comment.populate('author', 'name profileImage');
    res.status(201).json({ success: true, comment });
  } catch (err) { next(err); }
};

async function findOwnedComment(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) { error(res, 400, 'Invalid post or comment ID'); return null; }
  const post = await Post.findOne({ _id: req.params.postId, moderated: false });
  if (!post) { error(res, 404, 'Post not found'); return null; }
  const comment = post.comments.id(req.params.commentId);
  if (!comment) { error(res, 404, 'Comment not found'); return null; }
  if (comment.author.toString() !== req.user._id.toString()) { error(res, 403, 'Only the comment author may edit or delete it'); return null; }
  return { post, comment };
}

exports.updatePostComment = async (req, res, next) => {
  try {
    const found = await findOwnedComment(req, res); if (!found) return;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 2000) return error(res, 400, 'Comment must contain 1 to 2000 characters');
    found.comment.content = content; await found.post.save(); await found.comment.populate('author', 'name profileImage');
    res.json({ success: true, comment: found.comment });
  } catch (err) { next(err); }
};

exports.deletePostComment = async (req, res, next) => {
  try {
    const found = await findOwnedComment(req, res); if (!found) return;
    found.comment.deleteOne(); await found.post.save(); res.json({ success: true });
  } catch (err) { next(err); }
};
