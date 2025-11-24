import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Trash2,
  Edit,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import CommentSection from '../comment/CommentSection';

// Helper to get full media URL
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;
    if (mediaPath.startsWith('http')) return mediaPath;
    return `${API_URL}${mediaPath}`;
};

const PostCard = ({ post, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  // Guard clause
  if (!post.userId || !post.userId._id) {
    console.warn('⚠️  Post with null user:', post._id);
    return null; 
  }
  
  const isOwnPost = currentUser?._id === post.userId._id;

  // 1. LOGIKA STORY RING
  const storiesFeed = queryClient.getQueryData(['storiesFeed']);
  
  const postUserStoryGroup = storiesFeed?.find(group => 
      group.user._id === post.userId._id
  );
  
  const hasActiveStory = !!postUserStoryGroup;
  const hasUnviewed = postUserStoryGroup?.hasUnviewed || false;
  
  // 2. Helper untuk menentukan kelas border
  const getStoryRingClass = () => {
      if (!hasActiveStory) return ''; 
      
      // Menggunakan p-0.5 untuk ring yang lebih tipis
      return hasUnviewed
          ? 'p-0.5 bg-gradient-instagram' 
          : 'p-0.5 border-2 border-dark-700'; 
  };
  
  const ringClass = getStoryRingClass();

  // Handler saat avatar/ring diklik
  const handleAvatarClick = (e) => {
      if (hasActiveStory) {
          e.preventDefault(); 
          navigate(`/stories/${post.userId._id}`);
      }
  };
  // 🔚 LOGIKA STORY RING

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

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/posts/${post._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Post berhasil diupdate');
      setIsEditing(false);
      setShowMenu(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal mengupdate post');
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

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error('Content tidak boleh kosong');
      return;
    }

    editMutation.mutate({ content: editContent });
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

  const renderAvatarContent = () => (
    <>
      {post.userId.avatar ? (
        <img 
          src={getMediaUrl(post.userId.avatar)} 
          alt={post.userId.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold">
          {post.userId.username.charAt(0).toUpperCase()}
        </span>
      )}
    </>
  );

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <Link 
            to={`/profile/${post.userId._id}`} 
            onClick={handleAvatarClick} 
            className="flex items-center gap-3"
        >
          
          {/* 🚨 KUNCI PERBAIKAN: Gunakan ternary untuk merender ring/non-ring */}
          {hasActiveStory ? (
              // Jika ada story, render wrapper ring
              <div className={`avatar-ring ${ringClass}`}> 
                  <div className="avatar w-10 h-10 bg-dark-800 border-2 border-black"> 
                    {renderAvatarContent()}
                  </div>
              </div>
          ) : (
              // Jika tidak ada story, render avatar tanpa wrapper ring
              <div className="avatar w-10 h-10 bg-dark-800">
                {renderAvatarContent()}
              </div>
          )}

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
              <>
                {/* Backdrop untuk close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu dropdown */}
                <div className="absolute right-0 mt-2 w-48 card p-2 space-y-1 z-20">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-blue-500 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    <span>Hapus Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="relative bg-dark-900">
          {post.image.toLowerCase().endsWith('.mp4') || post.image.toLowerCase().endsWith('.mov') || post.image.toLowerCase().endsWith('.avi') ? (
            <video
              src={getMediaUrl(post.image)}
              controls
              className="w-full max-h-[600px] object-cover"
            />
          ) : (
            <img
              src={getMediaUrl(post.image)}
              alt="Post"
              className="w-full max-h-[600px] object-cover"
            />
          )}
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
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input w-full min-h-[80px] resize-none"
              placeholder="Edit caption..."
              disabled={editMutation.isPending}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={editMutation.isPending}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                {editMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>Simpan</span>
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={editMutation.isPending}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <X size={16} />
                <span>Batal</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            <Link
              to={`/profile/${post.userId._id}`}
              className="font-semibold hover:text-gray-300 transition-colors"
            >
              {post.userId.username}
            </Link>{' '}
            <span className="text-gray-300">{post.content}</span>
          </p>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post._id} onCommentUpdate={onUpdate} />
      )}
    </div>
  );
};

export default PostCard;