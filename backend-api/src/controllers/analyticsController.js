const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');
const mongoose = require('mongoose');

// 📊 AGREGASI: User Statistics
const getUserStatistics = async (req, res) => {
  try {
    console.log('📊 Getting user statistics with aggregation...');

    const stats = await User.aggregate([
      // Stage 1: Match active users
      {
        $match: {
          createdAt: { $exists: true }
        }
      },
      // Stage 2: Lookup posts count
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },
      // Stage 3: Lookup followers count
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'followingId',
          as: 'followers'
        }
      },
      // Stage 4: Lookup following count
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'followerId',
          as: 'following'
        }
      },
      // Stage 5: Add computed fields
      {
        $addFields: {
          postsCount: { $size: '$posts' },
          followersCount: { $size: '$followers' },
          followingCount: { $size: '$following' }
        }
      },
      // Stage 6: Project (select fields)
      {
        $project: {
          username: 1,
          email: 1,
          bio: 1,
          avatar: 1,
          postsCount: 1,
          followersCount: 1,
          followingCount: 1,
          createdAt: 1
        }
      },
      // Stage 7: Sort by followers (descending)
      {
        $sort: { followersCount: -1 }
      },
      // Stage 8: Limit to top 10
      {
        $limit: 10
      }
    ]);

    console.log(`✅ Found ${stats.length} users with statistics`);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('❌ Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user statistics'
    });
  }
};

// 📊 AGREGASI: Post Statistics with Likes and Comments
const getPostStatistics = async (req, res) => {
  try {
    console.log('📊 Getting post statistics with aggregation...');

    const stats = await Post.aggregate([
      // Stage 1: Lookup user info
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Stage 2: Unwind user array
      {
        $unwind: '$user'
      },
      // Stage 3: Lookup likes
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes'
        }
      },
      // Stage 4: Lookup comments
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      // Stage 5: Add computed fields
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          engagement: { 
            $add: [
              { $size: '$likes' }, 
              { $multiply: [{ $size: '$comments' }, 2] }
            ]
          }
        }
      },
      // Stage 6: Project fields
      {
        $project: {
          content: 1,
          image: 1,
          'user.username': 1,
          'user.avatar': 1,
          'user._id': 1,
          likesCount: 1,
          commentsCount: 1,
          engagement: 1,
          createdAt: 1
        }
      },
      // Stage 7: Sort by engagement
      {
        $sort: { engagement: -1 }
      },
      // Stage 8: Limit to top 20
      {
        $limit: 20
      }
    ]);

    console.log(`✅ Found ${stats.length} posts with statistics`);

    res.json({
      success: true,
      message: 'Post statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('❌ Get post statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get post statistics'
    });
  }
};

// 📊 AGREGASI: Daily Activity Statistics
const getDailyActivity = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    console.log(`📊 Getting daily activity for last ${days} days...`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activity = await Post.aggregate([
      // Stage 1: Match posts from last N days
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      // Stage 2: Group by date
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          postsCount: { $sum: 1 },
          posts: { $push: '$_id' }
        }
      },
      // Stage 3: Lookup likes for these posts
      {
        $lookup: {
          from: 'likes',
          let: { postIds: '$posts' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$postId', '$$postIds'] }
              }
            }
          ],
          as: 'likes'
        }
      },
      // Stage 4: Lookup comments
      {
        $lookup: {
          from: 'comments',
          let: { postIds: '$posts' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$postId', '$$postIds'] }
              }
            }
          ],
          as: 'comments'
        }
      },
      // Stage 5: Add counts
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' }
        }
      },
      // Stage 6: Project
      {
        $project: {
          date: '$_id',
          postsCount: 1,
          likesCount: 1,
          commentsCount: 1,
          _id: 0
        }
      },
      // Stage 7: Sort by date
      {
        $sort: { date: 1 }
      }
    ]);

    console.log(`✅ Found activity for ${activity.length} days`);

    res.json({
      success: true,
      message: 'Daily activity retrieved successfully',
      data: activity
    });
  } catch (error) {
    console.error('❌ Get daily activity error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get daily activity'
    });
  }
};

// 📊 AGREGASI: Trending Posts (Most engagement in last 24h)
const getTrendingPosts = async (req, res) => {
  try {
    console.log('📊 Getting trending posts...');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const trending = await Post.aggregate([
      // Stage 1: Join with user
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      // Stage 2: Join with likes from last 24h
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $gte: ['$createdAt', oneDayAgo] }
                  ]
                }
              }
            }
          ],
          as: 'recentLikes'
        }
      },
      // Stage 3: Join with comments from last 24h
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$postId', '$$postId'] },
                    { $gte: ['$createdAt', oneDayAgo] }
                  ]
                }
              }
            }
          ],
          as: 'recentComments'
        }
      },
      // Stage 4: Calculate trending score
      {
        $addFields: {
          recentLikesCount: { $size: '$recentLikes' },
          recentCommentsCount: { $size: '$recentComments' },
          trendingScore: {
            $add: [
              { $multiply: [{ $size: '$recentLikes' }, 1] },
              { $multiply: [{ $size: '$recentComments' }, 3] }
            ]
          }
        }
      },
      // Stage 5: Filter posts with engagement
      {
        $match: {
          trendingScore: { $gt: 0 }
        }
      },
      // Stage 6: Project
      {
        $project: {
          content: 1,
          image: 1,
          'user._id': 1,
          'user.username': 1,
          'user.avatar': 1,
          recentLikesCount: 1,
          recentCommentsCount: 1,
          trendingScore: 1,
          createdAt: 1
        }
      },
      // Stage 7: Sort by trending score
      {
        $sort: { trendingScore: -1 }
      },
      // Stage 8: Limit to top 10
      {
        $limit: 10
      }
    ]);

    console.log(`✅ Found ${trending.length} trending posts`);

    res.json({
      success: true,
      message: 'Trending posts retrieved successfully',
      data: trending
    });
  } catch (error) {
    console.error('❌ Get trending posts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trending posts'
    });
  }
};

// 📊 AGREGASI: User Engagement Summary
const getUserEngagement = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Getting user engagement summary:', userId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const engagement = await User.aggregate([
      // Stage 1: Match specific user
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }
      },
      // Stage 2: Lookup user's posts
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },
      // Stage 3: Lookup likes on user's posts
      {
        $lookup: {
          from: 'likes',
          let: { postIds: '$posts._id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$postId', '$$postIds'] }
              }
            }
          ],
          as: 'receivedLikes'
        }
      },
      // Stage 4: Lookup comments on user's posts
      {
        $lookup: {
          from: 'comments',
          let: { postIds: '$posts._id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$postId', '$$postIds'] }
              }
            }
          ],
          as: 'receivedComments'
        }
      },
      // Stage 5: Lookup followers
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'followingId',
          as: 'followers'
        }
      },
      // Stage 6: Calculate metrics
      {
        $addFields: {
          totalPosts: { $size: '$posts' },
          totalLikesReceived: { $size: '$receivedLikes' },
          totalCommentsReceived: { $size: '$receivedComments' },
          totalFollowers: { $size: '$followers' },
          avgLikesPerPost: {
            $cond: {
              if: { $gt: [{ $size: '$posts' }, 0] },
              then: {
                $divide: [
                  { $size: '$receivedLikes' },
                  { $size: '$posts' }
                ]
              },
              else: 0
            }
          },
          engagementRate: {
            $cond: {
              if: { $gt: [{ $size: '$posts' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $add: [
                          { $size: '$receivedLikes' },
                          { $multiply: [{ $size: '$receivedComments' }, 2] }
                        ]
                      },
                      { $size: '$posts' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      // Stage 7: Project final result
      {
        $project: {
          username: 1,
          email: 1,
          bio: 1,
          avatar: 1,
          totalPosts: 1,
          totalLikesReceived: 1,
          totalCommentsReceived: 1,
          totalFollowers: 1,
          avgLikesPerPost: { $round: ['$avgLikesPerPost', 2] },
          engagementRate: { $round: ['$engagementRate', 2] }
        }
      }
    ]);

    if (!engagement || engagement.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✅ User engagement calculated');

    res.json({
      success: true,
      message: 'User engagement retrieved successfully',
      data: engagement[0]
    });
  } catch (error) {
    console.error('❌ Get user engagement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user engagement'
    });
  }
};

// Export all functions
module.exports = {
  getUserStatistics,
  getPostStatistics,
  getDailyActivity,
  getTrendingPosts,
  getUserEngagement
};