const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const posts = require('../controllers/postController');

router.use(protect);
router.get('/', posts.listPosts);
router.post('/', posts.createPost);
router.get('/:postId', posts.getPost);
router.put('/:postId', posts.updatePost);
router.delete('/:postId', posts.deletePost);
router.post('/:postId/likes', posts.toggleLike);
router.post('/:postId/comments', posts.addPostComment);
router.put('/:postId/comments/:commentId', posts.updatePostComment);
router.delete('/:postId/comments/:commentId', posts.deletePostComment);
module.exports = router;
