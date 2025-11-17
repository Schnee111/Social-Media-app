const mongoose = require('mongoose');
const { Schema } = mongoose;

const FollowerSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, {
    timestamps: false,
    _id: true
});

// Compound index untuk prevent duplicate follows dan optimasi query
FollowerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowerSchema.index({ followingId: 1, followerId: 1 });

// Static method untuk check if following
FollowerSchema.statics.isFollowing = async function(followerId, followingId) {
    const follow = await this.findOne({ followerId, followingId });
    return !!follow;
};

module.exports = mongoose.model('Follower', FollowerSchema);