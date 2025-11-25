const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper function to extract and notify mentions
const handleMentions = async (content, senderId, relatedId, relatedType, io, onlineUsers, req) => {
  try {
    console.log('🏷️  handleMentions called with content:', content);
    
    // Extract all @username mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    console.log('🏷️  Mentions found:', mentions.length > 0 ? mentions : 'none');

    if (mentions.length === 0) {
      console.log('🏷️  No mentions detected, skipping notification creation');
      return;
    }

    console.log('🏷️  MENTIONS detected:', mentions);

    // Find users matching the mentioned usernames
    const mentionedUsers = await User.find({ username: { $in: mentions } }).select('_id username');
    console.log('🏷️  Found users:', mentionedUsers.length);

    // Create notifications for each mentioned user (if not the sender)
    for (const user of mentionedUsers) {
      if (user._id.toString() === senderId.toString()) {
        console.log('   ⊘ Skipping self-mention for:', user.username);
        continue; // Don't notify if mentioning yourself
      }

      try {
        const notification = new Notification({
          recipientId: user._id,
          senderId,
          type: 'mention',
          content: `menyebut Anda di ${relatedType === 'Post' ? 'postingan' : 'komentar'}`,
          relatedId,
          relatedType
        });

        await notification.save();
        console.log('   ✅ Mention notification saved for:', user.username);
        
        await notification.populate('senderId', 'username avatar');
        await notification.populate('relatedId', 'content postId');

        // Try to emit to recipient if online
        if (io && onlineUsers) {
          const recipientSocketId = onlineUsers.get(user._id.toString());
          console.log('   📡 Checking socket for', user.username, '- socketId:', recipientSocketId || 'NOT_ONLINE');
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive-notification', notification);
            console.log('   ✅ Mention notification emitted to:', user.username);
          }
        } else {
          console.log('   ⚠️ io or onlineUsers not available for socket emit');
        }
      } catch (err) {
        console.error('   ❌ Error creating mention notification for', user.username, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error in handleMentions:', err.message);
  }
};

// @desc    Create comment or reply
// @route   POST /api/comments/post/:postId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { content, parentId, replyToUserId } = req.body;
    const { postId } = req.params;
    const userId = req.user.userId;
    let parentComment = null;

    console.log('📝 Creating comment/reply:', { postId, userId, parentId });

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Content is required' 
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }

    // ✅ If replying, check parent comment exists
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ 
          success: false,
          error: 'Parent comment not found' 
        });
      }
      
      // ✅ Ensure parent is on same post
      if (parentComment.postId.toString() !== postId) {
        return res.status(400).json({ 
          success: false,
          error: 'Parent comment is not on this post' 
        });
      }
    }

    // Create comment/reply
    const comment = await Comment.create({
      postId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      replyToUserId: replyToUserId || null
    });

    console.log('✅ Comment created:', comment._id);

    // Populate user data
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar bio')
      .populate('replyToUserId', 'username');

    console.log('✅ Comment populated:', populatedComment);

    // --------------------------
    // Create notification for comment/reply
    // --------------------------
    try {
      // If this is a reply, notify the parent comment owner
      if (parentId && parentComment) {
        const recipientId = parentComment.userId.toString();
        if (recipientId !== userId) {
          console.log('🔵 NOTIF DEBUG - Reply detected. Creating notification for parent comment owner:', recipientId);

          const notification = new Notification({
            recipientId,
            senderId: userId,
            type: 'comment',
            content: 'replied to your comment',
            relatedId: populatedComment._id,
            relatedType: 'Comment'
          });

          await notification.save();
          await notification.populate('senderId', 'username avatar');
          await notification.populate('relatedId', 'content');

          const io = req.app.get('io');
          const onlineUsers = req.app.get('onlineUsers');
          const recipientSocketId = onlineUsers.get(recipientId);

          console.log('   Socket emit -> recipient:', recipientId, 'socketId:', recipientSocketId || 'NOT_ONLINE');
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive-notification', notification);
            console.log('   ✅ Socket emitted reply notification');
          }
        }
      } else {
        // Top-level comment -> notify post owner (if not the commenter)
        const recipientId = post.userId.toString();
        if (recipientId !== userId) {
          console.log('🔵 NOTIF DEBUG - Comment detected. Creating notification for post owner:', recipientId);

          const notification = new Notification({
            recipientId,
            senderId: userId,
            type: 'comment',
            content: 'commented on your post',
            relatedId: populatedComment._id,
            relatedType: 'Comment'
          });

          await notification.save();
          await notification.populate('senderId', 'username avatar');
          await notification.populate('relatedId', 'content');

          const io = req.app.get('io');
          const onlineUsers = req.app.get('onlineUsers');
          const recipientSocketId = onlineUsers.get(recipientId);

          console.log('   Socket emit -> recipient:', recipientId, 'socketId:', recipientSocketId || 'NOT_ONLINE');
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive-notification', notification);
            console.log('   ✅ Socket emitted comment notification');
          }
        }
      }

      // Handle mentions in comment
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      await handleMentions(content.trim(), userId, populatedComment._id, 'Comment', io, onlineUsers, req);
    } catch (notifErr) {
      console.error('❌ Error creating/emitting comment notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: parentId ? 'Reply created successfully' : 'Comment created successfully',
      data: populatedComment,
    });
  } catch (error) {
    console.error('❌ Create comment error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create comment'
    });
  }
};

// @desc    Get comments by post (with replies)
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log('📖 Getting comments for post:', postId);

    // ✅ Get top-level comments only (parentId = null)
    const comments = await Comment.find({ 
      postId, 
      parentId: null 
    })
      .populate('userId', 'username avatar bio')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Comment.countDocuments({ postId, parentId: null });

    console.log(`✅ Found ${comments.length} comments`);

    res.json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get comments'
    });
  }
};

// ✅ NEW: Get replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
exports.getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log('💬 Getting replies for comment:', commentId);

    const replies = await Comment.find({ 
      parentId: commentId 
    })
      .populate('userId', 'username avatar bio')
      .populate('replyToUserId', 'username')
      .sort({ createdAt: 1 }) // Oldest first for replies
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Comment.countDocuments({ parentId: commentId });

    console.log(`✅ Found ${replies.length} replies`);

    res.json({
      success: true,
      message: 'Replies retrieved successfully',
      data: replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get replies error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get replies'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Content is required' 
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to update this comment' 
      });
    }

    comment.content = content.trim();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar bio')
      .populate('replyToUserId', 'username');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    console.error('❌ Update comment error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to update comment'
    });
  }
};

// @desc    Delete comment (and all replies)
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to delete this comment' 
      });
    }

    // ✅ Delete all replies if this is a parent comment
    if (!comment.parentId) {
      await Comment.deleteMany({ parentId: comment._id });
      console.log('✅ Deleted all replies for comment:', comment._id);
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to delete comment'
    });
  }
};

// @desc    Get a single comment by id
// @route   GET /api/comments/:id
// @access  Public
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id)
      .populate('userId', 'username avatar bio')
      .populate('replyToUserId', 'username')
      .lean();

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('❌ Get comment by id error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get comment' });
  }
};