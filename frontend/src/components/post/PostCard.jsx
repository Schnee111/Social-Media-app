import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import CommentSection from '../comment/CommentSection';

const PostCard = ({ post, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnPost = currentUser?._id === post.userId._id;

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${post._id}/like`);
      return response.data;
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal like post');
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${post._id}/save`);
      return response.data;
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal save post');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post._id}`);
    },
    onSuccess: () => {
      toast.success('Post berhasil dihapus');
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal menghapus post');
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Yakin ingin menghapus post ini?')) {
      deleteMutation.mutate();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
          <div className="avatar-ring">
            <div className="avatar w-10 h-10 bg-dark-800">
              {post.userId.avatar ? (
                <img 
                  src={post.userId.avatar} 
                  alt={post.userId.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {post.userId.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold hover:text-gray-300 transition-colors">
              {post.userId.username}
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </Link>

        {/* Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn-ghost p-2"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 card p-2 space-y-1">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Hapus Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="relative bg-dark-900">
          <img
            src={`http://localhost:5000${post.image}`}
            alt="Post"
            className="w-full max-h-[600px] object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`post-action-btn ${post.isLiked ? 'text-red-500' : ''}`}
        >
          <Heart
            size={24}
            fill={post.isLiked ? 'currentColor' : 'none'}
            className="transition-all"
          />
          {post.likesCount > 0 && <span>{post.likesCount}</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="post-action-btn"
        >
          <MessageCircle size={24} />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
        </button>

        <button className="post-action-btn">
          <Send size={24} />
        </button>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className={`post-action-btn ml-auto ${post.isSaved ? 'text-yellow-500' : ''}`}
        >
          <Bookmark
            size={24}
            fill={post.isSaved ? 'currentColor' : 'none'}
            className="transition-all"
          />
        </button>
      </div>

      {/* Content */}
      <div className="post-content pb-2">
        <p className="text-sm">
          <Link
            to={`/profile/${post.userId._id}`}
            className="font-semibold hover:text-gray-300 transition-colors"
          >
            {post.userId.username}
          </Link>{' '}
          <span className="text-gray-300">{post.content}</span>
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post._id} onCommentUpdate={onUpdate} />
      )}
    </div>
  );
};

export default PostCard;