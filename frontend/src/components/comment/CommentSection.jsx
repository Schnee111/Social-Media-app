import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import CommentItem from './CommentItem';

const CommentSection = ({ postId, onCommentUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');

  // Fetch comments
  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/comments/post/${postId}`);
      return response.data.data;
    },
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/comments/post/${postId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Comment posted successfully');
      setNewComment('');
      refetch();
      onCommentUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to post comment');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    createMutation.mutate({ 
      content: newComment.trim(),
      parentId: null // ✅ Top-level comment
    });
  };

  return (
    <div className="border-t border-dark-800 pt-4 space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input flex-1 text-sm"
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newComment.trim()}
            className="btn btn-primary px-4 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onUpdate={() => {
                refetch();
                onCommentUpdate();
              }}
              isReply={false} // ✅ Top-level comments
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8 text-sm">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default CommentSection;