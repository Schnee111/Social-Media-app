import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Camera, User, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose, profile }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      formDataToSend.append('username', data.username);
      formDataToSend.append('bio', data.bio);
      if (data.avatar) {
        formDataToSend.append('avatar', data.avatar);
      }

      const response = await api.put('/users/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['currentUser']);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (formData.bio.length > 150) {
      toast.error('Bio must be less than 150 characters');
      return;
    }

    updateMutation.mutate({
      username: formData.username.trim(),
      bio: formData.bio.trim(),
      avatar: avatarFile,
    });
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar || null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="hover:bg-dark-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="avatar-ring">
                <div className="avatar w-24 h-24 bg-dark-800">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold">
                      {formData.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 p-2 rounded-full cursor-pointer transition-colors"
              >
                <Camera size={18} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={updateMutation.isPending}
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Click the camera icon to change your profile photo
              <br />
              Max size: 5MB
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User size={16} />
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="input w-full"
              disabled={updateMutation.isPending}
              minLength={3}
              maxLength={30}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.username.length}/30 characters
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FileText size={16} />
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              className="input w-full min-h-[100px] resize-none"
              disabled={updateMutation.isPending}
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/150 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;