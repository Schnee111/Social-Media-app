// front/src/components/story/StoryItem.jsx (KODE FINAL)
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const StoryItem = ({ user, hasUnviewed, isOwnStory, hasActiveStories }) => { 
  const navigate = useNavigate();

  if (!user) return null;

  const getAvatarContent = () => {
    if (user.avatar) {
      return (
        <img 
          src={getMediaUrl(user.avatar)} 
          alt={user.username} 
          className="w-full h-full object-cover" 
        />
      );
    }
    return (
      <span className="text-2xl font-semibold text-white">
        {user.username.charAt(0).toUpperCase()}
      </span>
    );
  };

  const getStoryBorderClass = () => {
    if (isOwnStory) {
      if (hasActiveStories) {
        return hasUnviewed 
          ? 'p-[2px] bg-gradient-instagram' 
          : 'p-[2px] border border-dark-600'; 
      } else {
        return 'p-[2px] border border-dark-600'; 
      }
    }
    return hasUnviewed
      ? 'p-[2px] bg-gradient-instagram' 
      : 'p-[2px] border border-dark-600'; 
  };

  const handleClick = () => {
    // Navigate immediately without await or invalidation
    if (isOwnStory) {
      if (hasActiveStories) {
        navigate(`/stories/${user._id}`);
      } else {
        navigate('/create?tab=story'); 
      }
    } else {
      navigate(`/stories/${user._id}`);
    }
  };
  
  const label = isOwnStory ? 'Your Story' : user.username;
  const showPlusIcon = isOwnStory && !hasActiveStories;

  return (
    <div 
      className="flex flex-col items-center flex-shrink-0 cursor-pointer" 
      onClick={handleClick}
    >
      {/* Ring Container */}
      <div className="relative">
        <div className={`${getStoryBorderClass()} rounded-full transition-all`}>
          {/* Avatar with inner border */}
          <div className="avatar w-20 h-20 bg-dark-800 border-2 border-black"> 
            {getAvatarContent()}
          </div>
        </div>
        
        {/* Plus Icon untuk Create Story */}
        {showPlusIcon && (
          <div className="absolute bottom-0 right-0 p-1.5 bg-primary-500 rounded-full border-2 border-black z-10">
            <Plus size={16} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Username Label */}
      <p className={`text-xs mt-2.5 truncate max-w-[84px] text-center ${
        hasUnviewed || (isOwnStory && hasActiveStories)
          ? 'font-semibold text-white' 
          : 'text-gray-400'
      }`}>
        {label}
      </p>
    </div>
  );
};

export default StoryItem;