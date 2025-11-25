import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Trash2, Check } from 'lucide-react';
import { markNotificationAsRead, deleteNotification } from '../../services/notificationService';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const NotificationItem = ({ notification, onRead, onDelete }) => {
    const navigate = useNavigate();

    // Get avatar or create placeholder with initials
    const getAvatarDisplay = () => {
        const avatar = notification.senderId?.avatar;
        const username = notification.senderId?.username || 'User';
        
        // If avatar exists and is not empty
        if (avatar && avatar.trim()) {
            return (
                <img
                    src={avatar}
                    alt={`${username}'s avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                        }
                    }}
                />
            );
        }
        
        // Placeholder with initials
        const initials = username.substring(0, 2).toUpperCase();
        return (
            <div className="w-10 h-10 rounded-full bg-gradient-instagram flex items-center justify-center text-white text-xs font-bold">
                {initials}
            </div>
        );
    };

    const handleMarkAsRead = async () => {
        try {
            await markNotificationAsRead(notification._id);
            onRead(notification._id);
        } catch (err) {
            toast.error('Gagal menandai notifikasi');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteNotification(notification._id);
            onDelete(notification._id);
            toast.success('Notifikasi dihapus');
        } catch (err) {
            toast.error('Gagal menghapus notifikasi');
        }
    };

    const getNotificationIcon = () => {
        switch (notification.type) {
            case 'like':
                return '❤️';
            case 'comment':
                return '💬';
            case 'mention':
                return '🏷️';
            case 'post':
                return '📝';
            case 'follow':
                return '👤';
            case 'message':
                return '💌';
            case 'story':
                return '📖';
            default:
                return '📢';
        }
    };

    const getNotificationMessage = () => {
        switch (notification.type) {
            case 'like':
                return `${notification.senderId?.username} menyukai postingan Anda`;
            case 'comment':
                return `${notification.senderId?.username} mengomentari postingan Anda`;
            case 'mention':
                return `${notification.senderId?.username} menyebut Anda`;
            case 'post':
                return `${notification.senderId?.username} membagikan postingan baru`;
            case 'follow':
                return `${notification.senderId?.username} mulai mengikuti Anda`;
            case 'message':
                return `${notification.senderId?.username} mengirim pesan`;
            case 'story':
                return `${notification.senderId?.username} membagikan cerita baru`;
            default:
                return notification.content;
        }
    };

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: id
    });

    const handleNotificationClick = async () => {
        console.debug('🔔 Notification click:', notification);
        // Mark as read
        if (!notification.isRead) {
            handleMarkAsRead();
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'like':
                // For likes, relatedId is the Post._id directly
                if (notification.relatedId?._id) {
                    const target = `/?postId=${notification.relatedId._id}`;
                    console.debug('🔔 Navigating to post (like)', target);
                    navigate(target);
                }
                break;

            case 'post':
                // For post notifications, relatedId is the Post._id
                if (notification.relatedId?._id) {
                    const target = `/?postId=${notification.relatedId._id}`;
                    console.debug('🔔 Navigating to post (new post notification)', target);
                    navigate(target);
                }
                break;

            case 'mention':
                // For mentions, relatedType indicates if it's a Post or Comment
                if (notification.relatedType === 'Post' && notification.relatedId?._id) {
                    // Mention in a post
                    const target = `/?postId=${notification.relatedId._id}`;
                    console.debug('🔔 Navigating to post (mention)', target);
                    navigate(target);
                } else if (notification.relatedType === 'Comment' && notification.relatedId?._id) {
                    // Mention in a comment - try to get postId
                    if (notification.relatedId?.postId) {
                        const target = `/?postId=${notification.relatedId.postId}&commentId=${notification.relatedId._id}`;
                        console.debug('🔔 Navigating to comment (mention)', target);
                        navigate(target);
                    } else {
                        // Fallback: fetch comment to get postId
                        try {
                            const commentId = notification.relatedId._id;
                            console.debug('🔔 Fetching comment for mention fallback:', commentId);
                            const res = await api.get(`/comments/${commentId}`);
                            const comment = res.data.data;
                            if (comment?.postId) {
                                const target = `/?postId=${comment.postId}&commentId=${comment._id}`;
                                console.debug('🔔 Navigating to comment (mention fallback)', target);
                                navigate(target);
                            }
                        } catch (err) {
                            console.error('❌ Failed to fetch comment for mention notification', err);
                        }
                    }
                }
                break;

            case 'comment':
                // For comments, relatedId is a Comment object (may or may not have postId)
                if (notification.relatedId?.postId) {
                    const target = `/?postId=${notification.relatedId.postId}&commentId=${notification.relatedId._id}`;
                    console.debug('🔔 Navigating to', target);
                    navigate(target);
                } else if (notification.relatedId?._id) {
                    // Fallback: try fetching the comment to get its postId
                    try {
                        const commentId = notification.relatedId._id;
                        console.debug('🔔 Fetching comment for fallback:', commentId);
                        const res = await api.get(`/comments/${commentId}`);
                        const comment = res.data.data;
                        if (comment?.postId) {
                            const target = `/?postId=${comment.postId}&commentId=${comment._id}`;
                            console.debug('🔔 Navigating to (from fetched comment)', target);
                            navigate(target);
                        } else {
                            // As a last resort, navigate to root
                            console.warn('⚠️ Comment had no postId; opening feed');
                            navigate('/');
                        }
                    } catch (err) {
                        console.error('❌ Failed to fetch comment for notification fallback', err);
                        navigate('/');
                    }
                }
                break;

            case 'follow':
                // Navigate to sender's profile
                if (notification.senderId?._id) {
                    navigate(`/profile/${notification.senderId._id}`);
                }
                break;

            case 'message':
                // Navigate to messages with sender
                if (notification.senderId?._id) {
                    navigate(`/messages/${notification.senderId._id}`);
                }
                break;

            case 'story':
                // Navigate to story viewer
                if (notification.senderId?._id) {
                    navigate(`/stories/${notification.senderId._id}`);
                }
                break;

            default:
                break;
        }
    };

    return (
        <div
            onClick={handleNotificationClick}
            className={`flex items-start gap-3 p-4 hover:bg-dark-800/50 transition-colors group cursor-pointer ${
                !notification.isRead ? 'bg-dark-800/30' : 'bg-dark-900/20'
            }`}
        >
            {/* Avatar (preferred) or Notification Icon fallback */}
            <div className="mt-0.5 flex-shrink-0">
                {notification.senderId ? (
                    getAvatarDisplay()
                ) : (
                    <div className="text-2xl">{getNotificationIcon()}</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 break-words leading-snug">
                    {getNotificationMessage()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>

                {/* If this is a comment notification, show a small preview of the comment/post */}
                {notification.type === 'comment' && (notification.relatedId?.content || notification.content) && (
                    <div className="mt-2 p-2 bg-dark-800 rounded text-xs text-gray-300">
                        {String(notification.relatedId?.content || notification.content).length > 200
                            ? String(notification.relatedId?.content || notification.content).slice(0, 200) + '...'
                            : notification.relatedId?.content || notification.content}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {!notification.isRead && (
                    <button
                        onClick={handleMarkAsRead}
                        className="p-1.5 hover:bg-dark-700 rounded-full transition-colors"
                        title="Tandai sebagai dibaca"
                    >
                        <Check size={16} className="text-gray-400 hover:text-blue-400" />
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-dark-700 rounded-full transition-colors"
                    title="Hapus"
                >
                    <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                </button>
            </div>

            {/* Unread indicator */}
            {!notification.isRead && (
                <div className="w-2 h-2 bg-gradient-instagram rounded-full flex-shrink-0 mt-1" />
            )}
        </div>
    );
};
