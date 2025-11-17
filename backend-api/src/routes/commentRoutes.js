const express = require('express');
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Create comment
router.post('/post/:postId', protect, createComment);

// Get comments by post
router.get('/post/:postId', getCommentsByPost);

// Update comment
router.put('/:id', protect, updateComment);

// Delete comment
router.delete('/:id', protect, deleteComment);

module.exports = router;