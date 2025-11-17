const mongoose = require('mongoose');
const { Schema } = mongoose;

const SavedPostSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index untuk prevent duplicate saves
SavedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPost', SavedPostSchema);