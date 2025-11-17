import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Image, X, Loader2 } from 'lucide-react';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const response = await api.post('/posts', postData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Post berhasil dibuat!');
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      onPostCreated();
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal membuat post');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Content tidak boleh kosong');
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      image: imageUrl.trim() || undefined,
    });
  };

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="avatar-ring">
            <div className="avatar w-10 h-10 bg-dark-800">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Apa yang sedang Anda pikirkan?"
              className="textarea"
              rows="3"
              disabled={createPostMutation.isPending}
            />
          </div>
        </div>

        {/* Image Input */}
        {showImageInput && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Masukkan URL gambar..."
                className="input flex-1"
                disabled={createPostMutation.isPending}
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="btn-ghost p-2"
                disabled={createPostMutation.isPending}
              >
                <X size={20} />
              </button>
            </div>

            {imageUrl && (
              <div className="relative rounded-lg overflow-hidden bg-dark-900">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    toast.error('URL gambar tidak valid');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-800">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="btn-ghost flex items-center gap-2"
            disabled={createPostMutation.isPending}
          >
            <Image size={20} />
            <span>Tambah Gambar</span>
          </button>

          <button
            type="submit"
            disabled={!content.trim() || createPostMutation.isPending}
            className="btn btn-gradient flex items-center gap-2"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;