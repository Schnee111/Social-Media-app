const Post = require('../models/Post');
const Like = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');

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

        // ✅ Handle multiple images
        let imageUrls = [];
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            imageUrls = req.uploadedFiles;
        }

        const post = new Post({
            userId,
            content: content.trim(),
            images: imageUrls, // Array of URLs
            image: imageUrls[0] || '' // First image for backward compatibility
        });

        await post.save();
        await post.populate('userId', 'username email avatar bio');

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
        
        // ✅ Update images jika ada upload baru
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            post.images = req.uploadedFiles;
            post.image = req.uploadedFiles[0];
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