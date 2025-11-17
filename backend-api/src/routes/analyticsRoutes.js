const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All analytics routes require authentication
router.use(protect);

// @route   GET /api/analytics/users
// @desc    Get user statistics (top users by followers)
// @access  Private
router.get('/users', analyticsController.getUserStatistics);

// @route   GET /api/analytics/posts
// @desc    Get post statistics (top posts by engagement)
// @access  Private
router.get('/posts', analyticsController.getPostStatistics);

// @route   GET /api/analytics/daily?days=7
// @desc    Get daily activity statistics
// @access  Private
router.get('/daily', analyticsController.getDailyActivity);

// @route   GET /api/analytics/trending
// @desc    Get trending posts (last 24h)
// @access  Private
router.get('/trending', analyticsController.getTrendingPosts);

// @route   GET /api/analytics/user/:userId
// @desc    Get user engagement summary
// @access  Private
router.get('/user/:userId', analyticsController.getUserEngagement);

module.exports = router;