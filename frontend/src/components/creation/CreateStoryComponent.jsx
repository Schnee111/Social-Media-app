// front/src/components/creation/CreateStoryComponent.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Loader2, Upload, Film, Image } from 'lucide-react';

const CreateStoryComponent = ({ onStoryCreated }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  // CLEANUP FUNCTION: Membersihkan URL Object saat unmount atau state berubah
  useEffect(() => {
    return () => {
      if (mediaPreview && !mediaPreview.startsWith('http')) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);


  const createStoryMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Story berhasil dibuat dan tayang 24 jam!');
      queryClient.invalidateQueries(['storiesFeed']);
      onStoryCreated(); 
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal membuat story');
    },
  });

  const handleMediaChange = (e) => {
    // Revoke URL Object lama sebelum membuat yang baru
    if (mediaPreview && !mediaPreview.startsWith('http')) {
        URL.revokeObjectURL(mediaPreview);
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

      setMediaFile(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      setMediaType(type);

      // FIXED: Gunakan URL.createObjectURL() untuk preview yang cepat dan non-blocking
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
      
    } else {
        setMediaFile(null);
        setMediaType(null);
        setMediaPreview(null);
    }
  };

  const handleRemoveMedia = () => {
    // Revoke URL Object saat menghapus file
    if (mediaPreview && !mediaPreview.startsWith('http')) {
        URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mediaFile) {
      toast.error('Media (gambar/video) wajib diunggah');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption.trim());
    formData.append('media', mediaFile); 

    createStoryMutation.mutate(formData);
  };

  const getMediaIcon = () => {
    if (mediaType === 'image') return <Image className="w-12 h-12 mb-3 text-gray-400" />;
    if (mediaType === 'video') return <Film className="w-12 h-12 mb-3 text-gray-400" />;
    return <Upload className="w-12 h-12 mb-3 text-gray-400" />;
  };
  
  const getMediaPreview = () => {
    if (!mediaPreview) return null;
    if (mediaType === 'video') {
        return (
            <video
                src={mediaPreview}
                controls
                className="w-full max-h-96 object-contain rounded-lg"
            />
        );
    }
    return (
        <img
            src={mediaPreview}
            alt="Preview"
            className="w-full max-h-96 object-contain rounded-lg"
        />
    );
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
          <p className="text-sm text-gray-400">Story akan hilang dalam 24 jam</p>
        </div>
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Media (Gambar/Video)
        </label>
        
        {!mediaPreview ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-dark-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {getMediaIcon()}
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Klik untuk upload</span>
              </p>
              <p className="text-xs text-gray-500">Gambar/Video (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              disabled={createStoryMutation.isPending}
            />
          </label>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-dark-900 border-2 border-primary-500">
            <div className="p-4 bg-dark-900">
                {getMediaPreview()}
            </div>
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black rounded-full transition-colors text-white"
              disabled={createStoryMutation.isPending}
            >
              <X size={20} />
            </button>
            <div className="p-4 border-t border-dark-800">
                <p className="text-sm text-gray-400">File terpilih: <span className="text-white font-medium">{mediaFile?.name}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Caption (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Caption (Opsional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tambahkan teks ke story Anda (maks 500 karakter)"
          className="textarea min-h-[80px]"
          maxLength={500}
          disabled={createStoryMutation.isPending}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
        <button
          type="button"
          onClick={() => onStoryCreated()}
          className="btn btn-secondary flex-1"
          disabled={createStoryMutation.isPending}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={!mediaFile || createStoryMutation.isPending}
          className="btn btn-gradient flex-1 flex items-center justify-center gap-2"
        >
          {createStoryMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Posting...</span>
            </>
          ) : (
            <span>Publish Story</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateStoryComponent;