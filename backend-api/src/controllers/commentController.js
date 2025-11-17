const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Create comment
// @route   POST /api/comments/post/:postId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    const userId = req.user.userId;

    console.log('📝 Creating comment:', { postId, userId, content });

    // Validation
    if (!content || !content.trim()) {
      console.log('❌ Content validation failed');
      return res.status(400).json({ 
        success: false,
        error: 'Content is required' 
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found:', postId);
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }

    console.log('✅ Post found, creating comment...');

    // Create comment
    const comment = await Comment.create({
      postId,
      userId,
      content: content.trim(),
    });

    console.log('✅ Comment created:', comment._id);

    // Populate user data
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar bio');

    console.log('✅ Comment populated:', populatedComment);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
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

// @desc    Get comments by post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    console.log('📖 Getting comments for post:', postId);

    const comments = await Comment.find({ postId })
      .populate('userId', 'username avatar bio')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${comments.length} comments`);

    res.json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
    });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get comments'
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

    console.log('✏️ Updating comment:', req.params.id);

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Content is required' 
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      console.log('❌ Comment not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      console.log('❌ Unauthorized update attempt');
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to update this comment' 
      });
    }

    comment.content = content.trim();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar bio');

    console.log('✅ Comment updated');

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

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('🗑️ Deleting comment:', req.params.id);

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      console.log('❌ Comment not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      console.log('❌ Unauthorized delete attempt');
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to delete this comment' 
      });
    }

    await comment.deleteOne();

    console.log('✅ Comment deleted');

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