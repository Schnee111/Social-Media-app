const mongoose = require('mongoose');
const { Schema } = mongoose;

const LikeSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    _id: true
});

// Compound index untuk prevent duplicate likes dan optimasi query
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
LikeSchema.index({ userId: 1, postId: 1 });

// Static method untuk check if liked
LikeSchema.statics.isLiked = async function(postId, userId) {
    const like = await this.findOne({ postId, userId });
    return !!like;
};

module.exports = mongoose.model('Like', LikeSchema);