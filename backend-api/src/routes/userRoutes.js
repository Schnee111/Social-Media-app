const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// IMPORTANT: Specific routes BEFORE :id routes

// Get current user
router.get('/me', protect, userController.getCurrentUser);

// Search users
router.get('/search', protect, userController.searchUsers);

// Get saved posts
router.get('/saved', protect, userController.getSavedPosts);

// Update profile
router.put('/profile', protect, userController.updateProfile);

// Get user by ID (PUT THIS LAST!)
router.get('/:id', protect, userController.getUserProfile);

// Follow/unfollow user
router.post('/:id/follow', protect, userController.followUser);

module.exports = router;