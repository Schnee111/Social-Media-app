const express = require('express');
const router = express.Router();
const {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory,
  getMyStories
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Create story - SESUAIKAN dengan pattern postRoutes.js
router.post('/', upload('media'), createStory);

// Get stories feed
router.get('/feed', getStoriesFeed);

// Get my stories
router.get('/my', getMyStories);

// Get user's stories
router.get('/user/:userId', getUserStories);

// View story
router.post('/:storyId/view', viewStory);

// Get story viewers
router.get('/:storyId/viewers', getStoryViewers);

// Delete story
router.delete('/:storyId', deleteStory);

module.exports = router;