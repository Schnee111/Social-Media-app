// front/src/components/story/StoryItem.jsx (KODE FINAL)
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;
    if (mediaPath.startsWith('http')) return mediaPath;
    return `${API_URL}${mediaPath}`;
};

const StoryItem = ({ user, hasUnviewed, isOwnStory, hasActiveStories }) => { 
    const navigate = useNavigate();
    const queryClient = useQueryClient();

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
        return <span className="text-lg font-semibold text-white">{user.username.charAt(0).toUpperCase()}</span>;
    };

    const getStoryBorderClass = () => {
        // Gunakan p-1 (4px padding total) untuk semua kondisi agar ukuran luar sama.
        if (isOwnStory) {
            if (hasActiveStories) {
                // Sudah ada story: Gunakan border gradient jika unviewed
                return hasUnviewed 
                    ? 'p-1 bg-gradient-instagram' 
                    : 'p-1 border-2 border-dark-700'; 
            } else {
                // Belum ada story (menampilkan +): Border sederhana dengan padding p-1
                return 'p-1 border-2 border-dark-700'; 
            }
        }
        // User lain
        return hasUnviewed
            ? 'p-1 bg-gradient-instagram' 
            : 'p-1 border-2 border-dark-700'; 
    };

    const handleClick = () => {
        if (isOwnStory) {
            if (hasActiveStories) {
                queryClient.invalidateQueries(['storiesFeed']);
                navigate(`/stories/${user._id}`);
            } else {
                navigate('/create?tab=story'); 
            }
        } else {
            queryClient.invalidateQueries(['storiesFeed']);
            navigate(`/stories/${user._id}`);
        }
    };
    
    const label = isOwnStory ? 'Your Story' : user.username;

    return (
        <div 
            className="flex flex-col items-center flex-shrink-0 w-[70px] cursor-pointer" 
            onClick={handleClick}
        >
            {/* Ring */}
            <div className={getStoryBorderClass() + ' rounded-full relative'}>
                {/* Avatar inner border (wajib) */}
                <div className="avatar w-14 h-14 bg-dark-800 border-2 border-black"> 
                    {getAvatarContent()}
                </div>
                
                {/* Icon Plus untuk Story Sendiri (Hanya tampil jika TIDAK memiliki active stories) */}
                {isOwnStory && !hasActiveStories && ( 
                    <div className="absolute bottom-0 right-0 p-0.5 bg-primary-500 rounded-full border-2 border-black z-10">
                        <Plus size={16} className="text-white" />
                    </div>
                )}
            </div>
            {/* Label */}
            <p className={`text-xs mt-1 truncate w-full text-center ${hasUnviewed || isOwnStory ? 'font-semibold text-white' : 'text-gray-400'}`}>
                {label}
            </p>
        </div>
    );
};

export default StoryItem;