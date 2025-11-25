const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createComment,
  getCommentsByPost,
  getReplies, // NEW
  getCommentById,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

router.post('/post/:postId', protect, createComment);
router.get('/post/:postId', getCommentsByPost);
router.get('/:commentId/replies', getReplies); // NEW
router.get('/:id', getCommentById);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;