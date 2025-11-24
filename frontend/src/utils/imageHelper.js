const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already full URL (Azure or external), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If local path, append to API URL
  return `${API_URL}/${imagePath}`;
};

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) {
    return 'https://ui-avatars.com/api/?background=random&name=User';
  }
  return getImageUrl(avatarPath);
};