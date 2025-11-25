const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'message', 'story', 'mention', 'post'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'relatedType' // 🔥 PENTING: Mengarahkan referensi dinamis berdasarkan field 'relatedType'
    },
    relatedType: {
        type: String,
        enum: ['Post', 'Comment', 'Story', 'User'],
        required: false
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index untuk query yang cepat
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });

// Populate sender dan related items
NotificationSchema.pre('find', function() {
    this.populate({
        path: 'senderId',
        select: 'username avatar'
    }).populate({
        path: 'relatedId',
        select: 'content image title'
    });
});

NotificationSchema.pre('findOne', function() {
    this.populate({
        path: 'senderId',
        select: 'username avatar'
    }).populate({
        path: 'relatedId',
        select: 'content image title'
    });
});

module.exports = mongoose.model('Notification', NotificationSchema);
