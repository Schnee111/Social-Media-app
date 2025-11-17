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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
CommentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);