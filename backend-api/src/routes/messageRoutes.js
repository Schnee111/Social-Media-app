const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Import controller functions
const messageController = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

// Specific routes first
router.get('/conversations/list', messageController.getConversations);
router.get('/unread/count', messageController.getUnreadCount);
router.get('/unread/per-conversation', messageController.getUnreadPerConversation);

// POST route
router.post('/', upload('media'), messageController.sendMessage);

// Dynamic routes last
router.get('/:userId', messageController.getMessages);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;