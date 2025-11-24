// front/src/components/creation/CreatePostComponent.jsx

import { useState, useEffect } from 'react'; // ⬅️ ADD useEffect
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Loader2, Upload, Film } from 'lucide-react';

const CreatePostComponent = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  // imagePreview kini menyimpan Object URL string
  const [imagePreview, setImagePreview] = useState(null); 
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  // 🆕 CLEANUP FUNCTION: Membersihkan URL Object saat unmount atau state berubah
  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  const getMediaIcon = () => {
    if (mediaType === 'video') return <Film className="w-12 h-12 mb-3 text-gray-400" />;
    return <Upload className="w-12 h-12 mb-3 text-gray-400" />;
  };

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
      onPostCreated(); 
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal membuat post');
    },
  });

  const handleImageChange = (e) => {
    // Revoke URL Object lama sebelum membuat yang baru
    if (imagePreview && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview);
    }
    
    const file = e.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('File harus berupa gambar atau video');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB');
        return;
      }

      setImageFile(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      setMediaType(type);

      // FIXED: Gunakan URL.createObjectURL() untuk preview yang cepat dan non-blocking
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      
    } else {
        setImageFile(null);
        setMediaType(null);
        setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    // Revoke URL Object saat menghapus file
    if (imagePreview && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setMediaType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() && !imageFile) {
      toast.error('Content atau media wajib diisi');
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

      {/* Image/Video Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gambar/Video (Opsional)
        </label>
        
        {!imagePreview ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-dark-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {getMediaIcon()}
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Klik untuk upload</span> atau drag & drop
              </p>
              <p className="text-xs text-gray-500">
                Gambar (PNG, JPG, GIF) atau Video (MP4, MOV). MAX. 10MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleImageChange}
              disabled={createPostMutation.isPending}
            />
          </label>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-dark-900">
            {mediaType === 'video' ? (
                // Tampilkan pratinjau video
                <video
                    src={imagePreview}
                    controls
                    className="w-full max-h-96 object-contain"
                />
            ) : (
                // Tampilkan pratinjau gambar
                <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain"
                />
            )}
            
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black rounded-full transition-colors"
              disabled={createPostMutation.isPending}
            >
              <X size={20} />
            </button>
            <div className="p-4 border-t border-dark-800">
                <p className="text-sm text-gray-400">File terpilih: <span className="text-white font-medium">{imageFile?.name}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
        <button
          type="button"
          onClick={() => onPostCreated()}
          className="btn btn-secondary flex-1"
          disabled={createPostMutation.isPending}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={!content.trim() && !imageFile || createPostMutation.isPending}
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
  );
};

export default CreatePostComponent;