import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MoreHorizontal, Trash2, Edit, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const CommentItem = ({ comment, onDelete, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwnComment = currentUser?._id === comment.userId._id;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/comments/${comment._id}`);
    },
    onSuccess: () => {
      toast.success('Komentar berhasil dihapus');
      onDelete();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal menghapus komentar');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (content) => {
      const response = await api.put(`/comments/${comment._id}`, { content });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Komentar berhasil diupdate');
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal mengupdate komentar');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Yakin ingin menghapus komentar ini?')) {
      deleteMutation.mutate();
    }
  };

  const handleUpdate = () => {
    if (!editText.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }
    updateMutation.mutate(editText.trim());
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.content);
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <div className="flex items-start gap-3 group">
      {/* Avatar */}
      <Link to={`/profile/${comment.userId._id}`}>
        <div className="avatar w-8 h-8 bg-dark-800">
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
        <div className="bg-dark-900 rounded-lg px-3 py-2">
          <Link
            to={`/profile/${comment.userId._id}`}
            className="font-semibold text-sm hover:text-gray-300 transition-colors"
          >
            {comment.userId.username}
          </Link>

          {isEditing ? (
            <div className="mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="input text-sm py-1"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="text-primary-500 hover:text-primary-400"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 mt-0.5">{comment.content}</p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Menu */}
      {isOwnComment && !isEditing && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn-ghost p-1"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 card p-1 space-y-0.5 z-10">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-dark-800 rounded transition-colors"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-dark-800 rounded transition-colors"
              >
                <Trash2 size={14} />
                <span>Hapus</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;