const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const azureUpload = require('../middleware/upload'); // ✅ Import Azure upload middleware

// IMPORTANT: Specific routes BEFORE :id routes

// Get current user
router.get('/me', protect, userController.getCurrentUser);

// Search users
router.get('/search', protect, userController.searchUsers);

// Get saved posts
router.get('/saved', protect, userController.getSavedPosts);

// Get suggested users for messaging
router.get('/suggestions', protect, userController.getSuggestedUsers);

// Update profile with Azure upload (field name: 'avatar')
router.put('/profile', protect, azureUpload('avatar'), userController.updateProfile);

// Get followers and following (BEFORE :id route!)
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

// Get user by ID (PUT THIS LAST!)
router.get('/:id', protect, userController.getUserProfile);

// Follow/unfollow user
router.post('/:id/follow', protect, userController.followUser);

module.exports = router;