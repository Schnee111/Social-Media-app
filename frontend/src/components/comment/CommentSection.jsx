import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import CommentItem from './CommentItem';

const CommentSection = ({ postId, onCommentUpdate }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  // Get comments
  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/comments/post/${postId}`);
      return response.data.data;
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content) => {
      // UBAH: text → content
      const response = await api.post(`/comments/post/${postId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      setCommentText('');
      refetch();
      onCommentUpdate();
      toast.success('Komentar berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal menambahkan komentar');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    createCommentMutation.mutate(commentText.trim());
  };

  return (
    <div className="border-t border-dark-800">
      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onDelete={() => {
                refetch();
                onCommentUpdate();
              }}
              onUpdate={() => {
                refetch();
                onCommentUpdate();
              }}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">
            Belum ada komentar
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="px-4 py-3 border-t border-dark-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="avatar w-8 h-8 bg-dark-800">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tulis komentar..."
            className="input flex-1"
            disabled={createCommentMutation.isPending}
          />

          <button
            type="submit"
            disabled={!commentText.trim() || createCommentMutation.isPending}
            className="btn-ghost p-2"
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;