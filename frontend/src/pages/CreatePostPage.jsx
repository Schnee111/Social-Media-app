import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, Loader2, Upload } from 'lucide-react';

const CreatePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const createPostMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Post berhasil dibuat!');
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal membuat post');
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
   if (file) {
      // Validasi file type untuk Gambar atau Video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('File harus berupa gambar atau video');
        return;
      }
      // Perbarui batasan ukuran file menjadi 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB');
        return;
      }

      setImageFile(file);

      // Create preview (Preview hanya dibuat jika itu gambar)
      if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
      } else {
          // 🆕 Jika video, set preview ke string deskriptif
          setImagePreview('VIDEO_FILE');
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Content tidak boleh kosong');
      return;
    }

    const formData = new FormData();
    formData.append('content', content.trim());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    createPostMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-6">Buat Post Baru</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="avatar-ring">
              <div className="avatar w-12 h-12 bg-dark-800">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-gray-400">Membuat post baru</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Apa yang sedang Anda pikirkan?"
              className="textarea min-h-[150px]"
              disabled={createPostMutation.isPending}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gambar (Opsional)
            </label>
            
            {!imagePreview || imagePreview === 'VIDEO_FILE' ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-dark-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {/* 🔄 PERUBAHAN: Update daftar tipe file dan ukuran */}
                    Gambar (PNG, JPG, GIF) atau Video (MP4, MOV). MAX. 10MB
                  </p>
                  {imagePreview === 'VIDEO_FILE' && (
                     <p className="text-sm text-primary-500 mt-2">Video Terpilih: {imageFile.name}</p>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  // 🔄 PERUBAHAN DI SINI: Terima image/* dan video/*
                  accept="image/*,video/*"
                  onChange={handleImageChange}
                  disabled={createPostMutation.isPending}
                />
              </label>
            ) : (
              // Tampilkan pratinjau gambar jika itu benar-benar gambar
              <div className="relative rounded-lg overflow-hidden bg-dark-900">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black rounded-full transition-colors"
                  disabled={createPostMutation.isPending}
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary flex-1"
              disabled={createPostMutation.isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!content.trim() || createPostMutation.isPending}
              className="btn btn-gradient flex-1 flex items-center justify-center gap-2"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post Sekarang</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;