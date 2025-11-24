const Story = require('../models/Story');
const User = require('../models/User');
const Follower = require('../models/Follower');

// POST /api/stories - Create story
exports.createStory = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Media file is required'
      });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';

    // SESUAIKAN: req.file.filename sudah berupa URL Azure penuh dari middleware
    const story = new Story({
      userId,
      media: req.file.filename, // URL Azure dari middleware
      mediaType,
      caption: caption || ''
    });

    await story.save();
    await story.populate('userId', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story'
    });
  }
};

// GET /api/stories/feed - Get stories from followed users
exports.getStoriesFeed = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get users that current user follows
    const following = await Follower.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Include own stories

    // Get active stories (not expired)
    const stories = await Story.find({
      userId: { $in: followingIds },
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const userIdStr = story.userId._id.toString();
      if (!groupedStories[userIdStr]) {
        groupedStories[userIdStr] = {
          user: story.userId,
          stories: [],
          hasUnviewed: false
        };
      }
      
      // Check if current user has viewed this story
      const hasViewed = story.viewers.some(
        viewer => viewer.userId.toString() === userId
      );
      
      if (!hasViewed) {
        groupedStories[userIdStr].hasUnviewed = true;
      }
      
      groupedStories[userIdStr].stories.push({
        ...story.toObject(),
        hasViewed
      });
    });

    // Convert to array and sort (unviewed first)
    const feedData = Object.values(groupedStories).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.json({
      success: true,
      data: feedData
    });
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stories feed'
    });
  }
};

// GET /api/stories/user/:userId - Get user's stories
exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const stories = await Story.find({
      userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 }); // Oldest first for viewing

    // Mark stories with view status
    const storiesWithStatus = stories.map(story => {
      const hasViewed = story.viewers.some(
        viewer => viewer.userId.toString() === currentUserId
      );
      
      return {
        ...story.toObject(),
        hasViewed,
        viewersCount: story.viewers.length
      };
    });

    res.json({
      success: true,
      data: storiesWithStatus
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stories'
    });
  }
};

// POST /api/stories/:storyId/view - Mark story as viewed
exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check if already viewed
    const alreadyViewed = story.viewers.some(
      viewer => viewer.userId.toString() === userId
    );

    if (!alreadyViewed) {
      story.viewers.push({ userId });
      await story.save();
    }

    res.json({
      success: true,
      message: 'Story viewed'
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark story as viewed'
    });
  }
};

// GET /api/stories/:storyId/viewers - Get story viewers
exports.getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findById(storyId)
      .populate('viewers.userId', 'username avatar');

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Only story owner can see viewers
    if (story.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view story viewers'
      });
    }

    res.json({
      success: true,
      data: story.viewers.sort((a, b) => b.viewedAt - a.viewedAt)
    });
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get story viewers'
    });
  }
};

// DELETE /api/stories/:storyId - Delete story
exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (story.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this story'
      });
    }

    // CATATAN: Hapus dari Azure bisa ditambahkan di sini jika diperlukan
    // Namun karena middleware upload.js tidak expose fungsi deleteFromAzure,
    // kita skip untuk sekarang atau tambahkan manual jika diperlukan

    await story.deleteOne();

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story'
    });
  }
};

// GET /api/stories/my - Get current user's active stories
exports.getMyStories = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stories = await Story.find({
      userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 });

    const storiesWithStats = stories.map(story => ({
      ...story.toObject(),
      viewersCount: story.viewers.length
    }));

    res.json({
      success: true,
      data: storiesWithStats
    });
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stories'
    });
  }
};