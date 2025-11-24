const User = require('../models/User');
const Follower = require('../models/Follower');
const Post = require('../models/Post');
const SavedPost = require('../models/SavedPost');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Conversation = require('../models/Conversation');

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Current user retrieved successfully',
            data: user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil data user'
        });
    }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;

        const user = await User.findById(id).select('-password').lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User tidak ditemukan'
            });
        }

        // Get counts
        const [postsCount, followersCount, followingCount, isFollowing] = await Promise.all([
            Post.countDocuments({ userId: id }),
            Follower.countDocuments({ followingId: id }),
            Follower.countDocuments({ followerId: id }),
            Follower.exists({ followerId: currentUserId, followingId: id })
        ]);

        // Get user posts
        const posts = await Post.find({ userId: id })
            .populate('userId', 'username avatar')
            .sort({ createdAt: -1 })
            .lean();

        // Add interaction data to posts
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const [likesCount, commentsCount, isLiked, isSaved] = await Promise.all([
                Like.countDocuments({ postId: post._id }),
                Comment.countDocuments({ postId: post._id }),
                Like.exists({ postId: post._id, userId: currentUserId }),
                SavedPost.exists({ postId: post._id, userId: currentUserId })
            ]);

            return {
                ...post,
                likesCount,
                commentsCount,
                isLiked: !!isLiked,
                isSaved: !!isSaved
            };
        }));

        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: {
                    ...user,
                    postsCount,
                    followersCount,
                    followingCount,
                    isFollowing: !!isFollowing
                },
                posts: postsWithDetails
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil profile user'
        });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, bio, avatar } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User tidak ditemukan'
            });
        }

        // Update fields
        if (username) {
            // Check if username is taken by another user
            const existingUser = await User.findOne({ 
                username, 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Username sudah digunakan'
                });
            }
            
            user.username = username;
        }
        
        if (bio !== undefined) user.bio = bio;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile berhasil diupdate',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengupdate profile'
        });
    }
};

// Follow/Unfollow user
exports.followUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;

        // Check if user exists
        const userToFollow = await User.findById(id);
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                error: 'User tidak ditemukan'
            });
        }

        // Can't follow yourself
        if (id === currentUserId) {
            return res.status(400).json({
                success: false,
                error: 'Anda tidak bisa follow diri sendiri'
            });
        }

        // Check if already following
        const existingFollow = await Follower.findOne({
            followerId: currentUserId,
            followingId: id
        });

        if (existingFollow) {
            // Unfollow
            await Follower.findByIdAndDelete(existingFollow._id);
            
            return res.json({
                success: true,
                message: 'Berhasil unfollow user',
                isFollowing: false
            });
        } else {
            // Follow
            await Follower.create({
                followerId: currentUserId,
                followingId: id
            });
            
            return res.json({
                success: true,
                message: 'Berhasil follow user',
                isFollowing: true
            });
        }
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat follow/unfollow user'
        });
    }
};

// Get saved posts
exports.getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const savedPosts = await SavedPost.find({ userId })
            .populate({
                path: 'postId',
                populate: {
                    path: 'userId',
                    select: 'username avatar bio'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Filter out null posts (in case post was deleted)
        const posts = savedPosts
            .map(sp => sp.postId)
            .filter(post => post !== null);

        // Add interaction data
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const [likesCount, commentsCount, isLiked, isSaved] = await Promise.all([
                Like.countDocuments({ postId: post._id }),
                Comment.countDocuments({ postId: post._id }),
                Like.exists({ postId: post._id, userId }),
                SavedPost.exists({ postId: post._id, userId })
            ]);

            return {
                ...post,
                likesCount,
                commentsCount,
                isLiked: !!isLiked,
                isSaved: !!isSaved
            };
        }));

        res.json({
            success: true,
            message: 'Saved posts retrieved successfully',
            data: postsWithDetails
        });
    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil saved posts'
        });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Query pencarian tidak boleh kosong'
            });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
        .select('-password')
        .limit(20)
        .lean();

        res.json({
            success: true,
            message: 'Search completed successfully',
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mencari users'
        });
    }
};

// Get suggested users (users not yet chatted with)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get users that current user has conversations with
    const conversations = await Conversation.find({
      participants: currentUserId
    }).populate('participants', '_id');

    const chattedUserIds = conversations.flatMap(conv => 
      conv.participants
        .filter(p => p._id.toString() !== currentUserId.toString())
        .map(p => p._id)
    );

    // Get random users excluding current user and chatted users
    const suggestedUsers = await User.find({
      _id: { 
        $nin: [...chattedUserIds, currentUserId]
      }
    })
      .select('username avatar bio')
      .limit(10);

    console.log(`✅ Found ${suggestedUsers.length} suggested users`);

    res.json({
      success: true,
      message: 'Suggested users retrieved successfully',
      data: suggestedUsers
    });
  } catch (error) {
    console.error('❌ Get suggested users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengambil suggested users'
    });
  }
};

// Add these functions to existing controller

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const { id } = req.params; // ✅ CHANGED from userId
    const currentUserId = req.user?.userId;

    console.log('📋 Getting followers for user:', id);

    // Get followers from Follower collection
    const followers = await Follower.find({ followingId: id }) // ✅ CHANGED
      .populate({
        path: 'followerId',
        select: 'username avatar bio'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Map to get user data
    const followersList = followers.map(f => f.followerId);

    // If current user is logged in, check if they follow each user
    if (currentUserId) {
      const followingIds = await Follower.find({ followerId: currentUserId })
        .select('followingId')
        .lean();
      
      const followingSet = new Set(followingIds.map(f => f.followingId.toString()));

      followersList.forEach(user => {
        user.isFollowing = followingSet.has(user._id.toString());
      });
    }

    console.log(`✅ Found ${followersList.length} followers`);

    res.json({
      success: true,
      message: 'Followers retrieved successfully',
      data: followersList
    });
  } catch (error) {
    console.error('❌ Get followers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get followers'
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const { id } = req.params; // ✅ CHANGED from userId
    const currentUserId = req.user?.userId;

    console.log('📋 Getting following for user:', id);

    // Get following from Follower collection
    const following = await Follower.find({ followerId: id }) // ✅ CHANGED
      .populate({
        path: 'followingId',
        select: 'username avatar bio'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Map to get user data
    const followingList = following.map(f => f.followingId);

    // If current user is logged in, check if they follow each user
    if (currentUserId) {
      const userFollowingIds = await Follower.find({ followerId: currentUserId })
        .select('followingId')
        .lean();
      
      const followingSet = new Set(userFollowingIds.map(f => f.followingId.toString()));

      followingList.forEach(user => {
        user.isFollowing = followingSet.has(user._id.toString());
      });
    }

    console.log(`✅ Found ${followingList.length} following`);

    res.json({
      success: true,
      message: 'Following retrieved successfully',
      data: followingList
    });
  } catch (error) {
    console.error('❌ Get following error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get following'
    });
  }
};