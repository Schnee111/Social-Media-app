const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id || req.user.userId;
    
    console.log('📤 Sending message:', {
      senderId,
      receiverId,
      hasContent: !!content,
      hasMedia: !!req.file
    });

    if (!senderId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      content: content || null,
      // 🔄 req.file.filename adalah URL Azure penuh
      media: req.file ? req.file.filename : null, 
      mediaType: req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null
    });

    await message.save();
    console.log('✅ Message saved:', message._id);

    // ✅ FIXED: Update or create conversation (without $expr)
    const participantIds = [senderId.toString(), receiverId.toString()].sort();
    
    console.log('🔍 Looking for conversation with participants:', participantIds);

    // Try to find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 }
    });

    if (conversation) {
      // Update existing conversation
      console.log('📝 Updating existing conversation:', conversation._id);
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.createdAt;
      await conversation.save();
    } else {
      // Create new conversation
      console.log('📝 Creating new conversation');
      conversation = new Conversation({
        participants: [senderId, receiverId],
        lastMessage: message._id,
        lastMessageAt: message.createdAt
      });
      await conversation.save();
    }

    console.log('✅ Conversation saved:', conversation._id);

    // Populate message with user data
    await message.populate([
      { path: 'senderId', select: 'username avatar' },
      { path: 'receiverId', select: 'username avatar' }
    ]);

    console.log('✅ Message populated');

    // ✅ EMIT SOCKET EVENT (with try-catch)
    // try {
    //   const io = req.app.get('io');
    //   if (io) {
    //     io.emit('new-message', {
    //       conversationId: conversation._id,
    //       message: message
    //     });
    //     console.log('🔔 Socket event emitted: new-message');
    //   }
    // } catch (socketError) {
    //   console.error('⚠️ Socket emit error:', socketError);
    //   // Don't fail the request if socket emit fails
    // }
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
};

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id || req.user.userId;

    console.log('📬 Getting messages between:', currentUserId, 'and', userId);

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    console.log('✅ Found', messages.length, 'messages');

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get messages'
    });
  }
};

// Get all conversations
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.userId;

    console.log('💬 Getting conversations for user:', currentUserId);

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'username avatar bio')
      .populate({
        path: 'lastMessage',
        select: 'content media mediaType createdAt senderId receiverId'
      })
      .sort({ lastMessageAt: -1 });

    console.log('✅ Found', conversations.length, 'conversations');

    // Format response
    const formattedConversations = conversations.map(conv => {
      // Get the other participant (not current user)
      const otherUser = conv.participants.find(
        p => p._id.toString() !== currentUserId.toString()
      );

      // Count unread messages
      return Message.countDocuments({
        senderId: otherUser._id,
        receiverId: currentUserId,
        isRead: false
      }).then(unreadCount => ({
        _id: conv._id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount
      }));
    });

    const result = await Promise.all(formattedConversations);

    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversations'
    });
  }
};

// Get unread message count (total)
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.userId;

    const unreadCount = await Message.countDocuments({
      receiverId: currentUserId,
      isRead: false
    });

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      unreadCount
    });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count'
    });
  }
};

// Get unread messages per conversation
const getUnreadPerConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.userId;

    // Get all conversations for current user
    const conversations = await Conversation.find({
      participants: currentUserId
    }).populate('participants', 'username avatar _id');

    // Get unread count for each conversation
    const unreadPerConversation = await Promise.all(
      conversations.map(async (conv) => {
        // Count unread messages from the other participant
        const unreadCount = await Message.countDocuments({
          receiverId: currentUserId,
          senderId: conv.participants.find(p => p._id.toString() !== currentUserId.toString())._id,
          isRead: false
        });

        // Find the other participant
        const otherUser = conv.participants.find(
          p => p._id.toString() !== currentUserId.toString()
        );

        return {
          conversationId: conv._id,
          userId: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          unreadCount
        };
      })
    );

    // Filter out conversations with 0 unread
    const filteredUnread = unreadPerConversation.filter(item => item.unreadCount > 0);

    res.json({
      success: true,
      message: 'Unread per conversation retrieved successfully',
      data: filteredUnread
    });
  } catch (error) {
    console.error('❌ Get unread per conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread per conversation'
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id || req.user.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete message'
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
  getUnreadPerConversation,
  deleteMessage
};