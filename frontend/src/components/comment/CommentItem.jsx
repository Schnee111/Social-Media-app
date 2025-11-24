import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper to get full media URL
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const CommentItem = ({ comment, onUpdate, isReply = false, parentCommentId = null }) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const isOwnComment = currentUser?._id === comment.userId._id;
  
  // Tentukan apakah comment terlalu panjang (lebih dari 150 karakter)
  const MAX_LENGTH = 150;
  const isLongComment = comment.content.length > MAX_LENGTH;
  const displayContent = showFullContent || !isLongComment 
    ? comment.content 
    : comment.content.slice(0, MAX_LENGTH) + '...';

  // Fetch replies (hanya untuk parent comment)
  const { data: repliesData, refetch: refetchReplies } = useQuery({
    queryKey: ['replies', comment._id],
    queryFn: async () => {
      const response = await api.get(`/comments/${comment._id}/replies`);
      return response.data.data;
    },
    enabled: showReplies && !isReply,
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/comments/${comment._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Comment updated successfully');
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to update comment');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/comments/${comment._id}`);
    },
    onSuccess: () => {
      toast.success('Comment deleted successfully');
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to delete comment');
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/comments/post/${comment.postId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reply posted successfully');
      setIsReplying(false);
      setReplyContent('');
      
      // Jika ini reply dari parent comment, set showReplies true
      if (!isReply) {
        setShowReplies(true);
        refetchReplies();
      }
      
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to post reply');
    },
  });

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    editMutation.mutate({ content: editContent.trim() });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate();
    }
  };

  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    
    // Jika ini reply, gunakan parentCommentId, jika parent gunakan comment._id
    const targetParentId = isReply ? parentCommentId : comment._id;
    
    replyMutation.mutate({
      content: replyContent.trim(),
      parentId: targetParentId,
      replyToUserId: comment.userId._id,
    });
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <div className={`${isReply ? 'ml-6' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${comment.userId._id}`} className="flex-shrink-0">
          <div className="avatar w-8 h-8 bg-dark-800">
            {comment.userId.avatar ? (
              <img
                src={getMediaUrl(comment.userId.avatar)}
                alt={comment.userId.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold">
                {comment.userId.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input w-full min-h-[60px] resize-none text-sm"
                placeholder="Edit your comment..."
                disabled={editMutation.isPending}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={editMutation.isPending}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  {editMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin inline" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={editMutation.isPending}
                  className="text-xs text-gray-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <>
              <div>
                <p className="text-sm break-words">
                  <Link
                    to={`/profile/${comment.userId._id}`}
                    className="font-semibold hover:underline"
                  >
                    {comment.userId.username}
                  </Link>
                  {comment.replyToUserId && (
                    <>
                      {' '}
                      <span className="text-gray-500">→</span>{' '}
                      <Link
                        to={`/profile/${comment.replyToUserId._id}`}
                        className="text-primary-500 hover:underline"
                      >
                        @{comment.replyToUserId.username}
                      </Link>
                    </>
                  )}
                  <span className="text-gray-300 ml-2">{displayContent}</span>
                </p>
                
                {/* Read More / Read Less Button */}
                {isLongComment && (
                  <button
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="text-xs text-gray-400 hover:text-white font-semibold mt-1"
                  >
                    {showFullContent ? 'Read less' : 'Read more'}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{timeAgo}</span>

                  {/* Reply button - tersedia untuk semua comment */}
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-xs text-gray-400 hover:text-white font-semibold"
                  >
                    Reply
                  </button>

                  {isOwnComment && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 size={12} className="animate-spin inline" />
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reply Input */}
              {isReplying && (
                <div className="mt-3 flex gap-2">
                  <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={getMediaUrl(currentUser.avatar)}
                        alt={currentUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold">
                        {currentUser?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to @${comment.userId.username}...`}
                      className="input w-full text-sm py-2"
                      disabled={replyMutation.isPending}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReply}
                        disabled={replyMutation.isPending || !replyContent.trim()}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50"
                      >
                        {replyMutation.isPending ? (
                          <Loader2 size={12} className="animate-spin inline" />
                        ) : (
                          'Post'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsReplying(false);
                          setReplyContent('');
                        }}
                        disabled={replyMutation.isPending}
                        className="text-xs text-gray-400 hover:text-white font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show Replies Button */}
              {!isReply && comment.replyCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 mt-2 text-xs text-gray-400 hover:text-white font-semibold"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp size={14} />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Render Replies */}
          {showReplies && !isReply && repliesData && repliesData.length > 0 && (
            <div className="mt-3 space-y-3">
              {repliesData.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onUpdate={() => {
                    refetchReplies();
                    onUpdate();
                  }}
                  isReply={true}
                  parentCommentId={comment._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;