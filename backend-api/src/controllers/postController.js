const Post = require('../models/Post');
const Like = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');

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

// Create post
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Content wajib diisi'
            });
        }

        //  Handle multiple media (images/videos)
        let mediaUrls = [];
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            mediaUrls = req.uploadedFiles;
        }

        const post = new Post({
            userId,
            content: content.trim(),
            media: mediaUrls // Array of media URLs
        });

        await post.save();
        await post.populate('userId', 'username email avatar bio');

        // Handle mentions in post content
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        await handleMentions(content.trim(), userId, post._id, 'Post', io, onlineUsers, req);

        res.status(201).json({
            success: true,
            message: 'Post berhasil dibuat',
            data: post
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat membuat post'
        });
    }
};

// Get all posts tetap sama, hanya response yang berbeda
exports.getAllPosts = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate({
                path: 'userId',
                select: 'username email avatar bio',
                match: { _id: { $exists: true, $ne: null } }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const validPosts = posts.filter(post => post.userId !== null);

        const postsWithDetails = await Promise.all(validPosts.map(async (post) => {
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

        const total = await Post.countDocuments();

        res.json({
            success: true,
            message: 'Posts retrieved successfully',
            data: postsWithDetails,
            pagination: {
                page,
                limit,
                total: validPosts.length,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil posts'
        });
    }
};

// Update post - tambahkan handling multiple images
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post tidak ditemukan'
            });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Anda tidak memiliki akses untuk mengupdate post ini'
            });
        }

        if (content !== undefined) post.content = content.trim();
        
        // Update media jika ada upload baru
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            post.media = req.uploadedFiles;
        }

        await post.save();
        await post.populate('userId', 'username email avatar bio');

        res.json({
            success: true,
            message: 'Post berhasil diupdate',
            data: post
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengupdate post'
        });
    }
};

// getFeed, getPostById, deletePost, likePost, savePost tetap sama
exports.getFeed = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const following = await Follower.find({ followerId: currentUserId })
            .select('followingId')
            .lean();

        const followingIds = following.map(f => f.followingId);
        followingIds.push(currentUserId);

        const posts = await Post.find({ userId: { $in: followingIds } })
            .populate({
                path: 'userId',
                select: 'username email avatar bio',
                match: { _id: { $exists: true, $ne: null } }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const validPosts = posts.filter(post => post.userId !== null);

        const postsWithDetails = await Promise.all(validPosts.map(async (post) => {
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

        const total = await Post.countDocuments({ userId: { $in: followingIds } });

        res.json({
            success: true,
            message: 'Feed retrieved successfully',
            data: postsWithDetails,
            pagination: {
                page,
                limit,
                total: validPosts.length,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil feed'
        });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;

        const post = await Post.findById(id)
            .populate('userId', 'username email avatar bio')
            .lean();

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post tidak ditemukan'
            });
        }

        const [likesCount, commentsCount, isLiked, isSaved] = await Promise.all([
            Like.countDocuments({ postId: post._id }),
            Comment.countDocuments({ postId: post._id }),
            Like.exists({ postId: post._id, userId: currentUserId }),
            SavedPost.exists({ postId: post._id, userId: currentUserId })
        ]);

        res.json({
            success: true,
            message: 'Post retrieved successfully',
            data: {
                ...post,
                likesCount,
                commentsCount,
                isLiked: !!isLiked,
                isSaved: !!isSaved
            }
        });
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengambil post'
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post tidak ditemukan'
            });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Anda tidak memiliki akses untuk menghapus post ini'
            });
        }

        await Promise.all([
            Post.findByIdAndDelete(id),
            Like.deleteMany({ postId: id }),
            Comment.deleteMany({ postId: id }),
            SavedPost.deleteMany({ postId: id })
        ]);

        res.json({
            success: true,
            message: 'Post berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat menghapus post'
        });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post tidak ditemukan'
            });
        }

        const existingLike = await Like.findOne({
            postId: id,
            userId: userId
        });

        let isLiked;
        let message;

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            isLiked = false;
            message = 'Post berhasil di-unlike';
        } else {
            await Like.create({
                postId: id,
                userId: userId
            });
            isLiked = true;
            message = 'Post berhasil di-like';
        }

        const likesCount = await Like.countDocuments({ postId: id });

        // Trigger notification jika like dan bukan post sendiri
        if (isLiked && post.userId.toString() !== userId) {
            try {
                console.log('\n🔵 NOTIF DEBUG - Like detected');
                console.log('   Post owner:', post.userId.toString());
                console.log('   Liker:', userId);
                console.log('   Different user? YES - Create notification');

                const notification = new Notification({
                    recipientId: post.userId,
                    senderId: userId,
                    type: 'like',
                    content: 'liked your post',
                    relatedId: post._id,
                    relatedType: 'Post'
                });
                
                console.log('   Saving to DB...');
                await notification.save();
                console.log('   ✅ Saved:', notification._id);

                await notification.populate('senderId', 'username avatar');
                await notification.populate('relatedId', 'content image');

                // Emit via Socket.IO
                const io = req.app.get('io');
                const onlineUsers = req.app.get('onlineUsers');
                const recipientSocketId = onlineUsers.get(post.userId.toString());
                
                console.log('   Socket emit:');
                console.log('   - Recipient ID:', post.userId.toString());
                console.log('   - Socket ID:', recipientSocketId || 'NOT_ONLINE');
                
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('receive-notification', notification);
                    console.log('   ✅ Socket emitted successfully\n');
                } else {
                    console.log('   ⚠️  Recipient not online\n');
                }
            } catch (notifError) {
                console.error('❌ Error creating notification:', notifError);
            }
        } else {
            console.log('\n🔵 NOTIF DEBUG - Like not sent (isLiked:', isLiked, ', same user?', post.userId.toString() === userId, ')\n');
        }

        res.json({
            success: true,
            message,
            data: {
                isLiked,
                likesCount
            }
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan'
        });
    }
};

exports.savePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post tidak ditemukan'
            });
        }

        const existingSave = await SavedPost.findOne({
            postId: id,
            userId: userId
        });

        let isSaved;
        let message;

        if (existingSave) {
            await SavedPost.findByIdAndDelete(existingSave._id);
            isSaved = false;
            message = 'Post berhasil dihapus dari saved';
        } else {
            await SavedPost.create({
                postId: id,
                userId: userId
            });
            isSaved = true;
            message = 'Post berhasil disimpan';
        }

        res.json({
            success: true,
            message,
            data: {
                isSaved
            }
        });
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan'
        });
    }
};