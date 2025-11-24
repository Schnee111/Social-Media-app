import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FollowersModal = ({ isOpen, onClose, userId, type = 'followers' }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(type);

  // Fetch followers
  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/followers`);
      return response.data.data;
    },
    enabled: isOpen && activeTab === 'followers',
  });

  // Fetch following
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/following`);
      return response.data.data;
    },
    enabled: isOpen && activeTab === 'following',
  });

  if (!isOpen) return null;

  const currentData = activeTab === 'followers' ? followersData : followingData;
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex gap-4 flex-1">
            <button
              onClick={() => setActiveTab('followers')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'followers'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'following'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400'
              }`}
            >
              Following
            </button>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-dark-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : currentData && currentData.length > 0 ? (
            <div className="space-y-3">
              {currentData.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  {/* Avatar */}
                  <div className="avatar w-12 h-12 bg-gradient-instagram flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.username}</h3>
                    {user.bio && (
                      <p className="text-sm text-gray-400 truncate">{user.bio}</p>
                    )}
                  </div>

                  {/* Follow Status Badge (optional) */}
                  {user._id !== currentUser?._id && user.isFollowing && (
                    <span className="text-xs text-gray-400 px-2 py-1 bg-dark-800 rounded">
                      Following
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;