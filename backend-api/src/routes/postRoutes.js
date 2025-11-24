const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  savePost,
  getFeed,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create post with image upload
router.post('/', protect, upload('image'), createPost);

// Get all posts (TAMBAH PROTECT!)
router.get('/', protect, getAllPosts);

// Get feed
router.get('/feed', protect, getFeed);

// Get post by ID
router.get('/:id', protect, getPostById);

// Update post
router.put('/:id', protect, updatePost);

// Delete post
router.delete('/:id', protect, deletePost);

// Like/unlike post
router.post('/:id/like', protect, likePost);

// Save/unsave post
router.post('/:id/save', protect, savePost);

module.exports = router;