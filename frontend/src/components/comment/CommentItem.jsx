import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Edit, X, Check, Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ comment, onUpdate, isReply = false }) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isOwnComment = currentUser?._id === comment.userId._id;

  // ✅ Fetch replies for this comment
  const { data: repliesData, refetch: refetchReplies } = useQuery({
    queryKey: ['replies', comment._id],
    queryFn: async () => {
      const response = await api.get(`/comments/${comment._id}/replies`);
      return response.data.data;
    },
    enabled: showReplies && !isReply, // Only fetch if showing replies and not already a reply
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

  // ✅ Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/comments/post/${comment.postId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reply posted successfully');
      setIsReplying(false);
      setReplyContent('');
      setShowReplies(true); // Automatically show replies
      refetchReplies();
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to post reply');
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

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

  // ✅ Handle reply submission
  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    replyMutation.mutate({
      content: replyContent.trim(),
      parentId: comment._id, // ✅ Link to parent comment
      replyToUserId: comment.userId._id, // ✅ Who we're replying to
    });
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${comment.userId._id}`}>
          <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
            {comment.userId.avatar ? (
              <img
                src={comment.userId.avatar}
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
                  className="btn btn-primary btn-sm flex items-center gap-1"
                >
                  {editMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={editMutation.isPending}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <>
              <div className="bg-dark-800 rounded-2xl px-3 py-2">
                <Link
                  to={`/profile/${comment.userId._id}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {comment.userId.username}
                </Link>
                {/* ✅ Show who this reply is to */}
                {comment.replyToUserId && (
                  <Link
                    to={`/profile/${comment.replyToUserId._id}`}
                    className="text-primary-500 text-sm ml-1 hover:underline"
                  >
                    @{comment.replyToUserId.username}
                  </Link>
                )}
                <p className="text-sm text-gray-300 mt-1 break-words">
                  {comment.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-1 px-3">
                <span className="text-xs text-gray-500">{timeAgo}</span>

                {/* ✅ Reply button (only for top-level comments) */}
                {!isReply && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-xs text-gray-400 hover:text-white transition-colors font-semibold"
                  >
                    Reply
                  </button>
                )}

                {isOwnComment && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors font-semibold"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* ✅ Reply Input */}
              {isReplying && (
                <div className="mt-3 flex gap-2">
                  <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
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
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.userId.username}...`}
                      className="input w-full min-h-[60px] resize-none text-sm"
                      disabled={replyMutation.isPending}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReply}
                        disabled={replyMutation.isPending || !replyContent.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        {replyMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          'Post Reply'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsReplying(false);
                          setReplyContent('');
                        }}
                        disabled={replyMutation.isPending}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Show Replies Button */}
              {!isReply && comment.replyCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-2 mt-2 px-3 text-xs text-gray-400 hover:text-white transition-colors font-semibold"
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

          {/* ✅ Render Replies */}
          {showReplies && !isReply && repliesData && repliesData.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-dark-700 pl-4">
              {repliesData.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onUpdate={() => {
                    refetchReplies();
                    onUpdate();
                  }}
                  isReply={true}
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