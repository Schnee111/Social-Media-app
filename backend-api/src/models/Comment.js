const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post ID wajib diisi'],
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID wajib diisi'],
        index: true
    },
    content: {
        type: String,
        required: [true, 'Komentar tidak boleh kosong'],
        trim: true,
        maxlength: [500, 'Komentar maksimal 500 karakter']
    },
    // ✅ Parent comment (null = top-level comment)
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    // ✅ User being replied to (for @mentions UI)
    replyToUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // ✅ Reply count (denormalized for performance)
    replyCount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound indexes
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 }); // ✅ For replies query
CommentSchema.index({ parentId: 1, createdAt: 1 }); // ✅ For fetching replies

// ✅ Pre-save hook: Increment parent replyCount
CommentSchema.pre('save', async function(next) {
    if (this.isNew && this.parentId) {
        await this.model('Comment').findByIdAndUpdate(
            this.parentId,
            { $inc: { replyCount: 1 } }
        );
    }
    next();
});

// ✅ Pre-remove hook: Decrement parent replyCount
CommentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    if (this.parentId) {
        await this.model('Comment').findByIdAndUpdate(
            this.parentId,
            { $inc: { replyCount: -1 } }
        );
    }
    next();
});

module.exports = mongoose.model('Comment', CommentSchema);