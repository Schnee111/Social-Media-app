import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/post/PostCard';
import PostDetailModal from '../components/post/PostDetailModal';
import FollowersModal from '../components/user/FollowersModal';
import EditProfileModal from '../components/user/EditProfileModal';
import { Loader2, Settings, Grid, Bookmark, UserPlus, UserMinus, MessageCircle, MapPin, Link as LinkIcon, Calendar, Camera, BookMarked } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// Helper to get full media URL
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const isOwnProfile = currentUser?._id === userId;

  // Get user profile
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}`);
      return response.data.data;
    },
  });

  // Get saved posts
  const { data: savedPosts, isLoading: savedLoading, refetch: refetchSaved } = useQuery({
    queryKey: ['savedPosts'],
    queryFn: async () => {
      const response = await api.get('/users/saved');
      return response.data.data;
    },
    enabled: isOwnProfile && activeTab === 'saved',
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: (data) => {
      refetchProfile();
      if (data.isFollowing) {
        toast.success('Successfully followed user');
      } else {
        toast.success('Successfully unfollowed user');
      }
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to follow/unfollow user');
    },
  });

  const handleFollow = () => {
    followMutation.mutate();
  };

  const handleSendMessage = () => {
    navigate(`/messages/${userId}`);
  };

  const handleShowFollowers = () => {
    setFollowersModalType('followers');
    setShowFollowersModal(true);
  };

  const handleShowFollowing = () => {
    setFollowersModalType('following');
    setShowFollowersModal(true);
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  // Open post detail modal
  const handleOpenModal = (postId) => {
    setSelectedPostId(postId);
  };

  // Called when a post is updated/changed inside PostCard or PostDetailModal
  // It will refetch the current tab (posts or saved) so the UI stays in sync
  const handleModalUpdate = async () => {
    try {
      if (activeTab === 'posts') {
        await refetchProfile();
      } else {
        await refetchSaved();
      }
    } catch (err) {
      console.error('Error updating posts after modal action:', err);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  const profile = profileData?.user;
  const posts = profileData?.posts || [];
  const currentPosts = activeTab === 'posts' ? posts : savedPosts;
  const currentLoading = activeTab === 'posts' ? false : savedLoading;

  const joinedDate = profile?.createdAt ? formatDistanceToNow(new Date(profile.createdAt), {
    addSuffix: true,
  }) : '';

  return (
    <div className="max-w-4xl mx-auto pb-6"> {/* ✅ Changed from max-w-7xl to max-w-4xl */}
      {/* Profile Header */}
      <div className="card mb-6">
        {/* Cover Photo Area */}
        <div className="h-32 bg-gradient-to-r from-primary-500/20 via-pink-500/20 to-purple-500/20 rounded-t-xl"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar & Actions */}
          <div className="flex items-end justify-between -mt-16 mb-6">
            <div className="avatar-ring p-1 bg-gradient-instagram">
              <div className="avatar w-32 h-32 bg-dark-900 border-4 border-dark-900">
                {profile?.avatar ? (
                  <img 
                    src={getMediaUrl(profile.avatar)} 
                    alt={profile.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-4xl font-bold">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-4">
              {isOwnProfile ? (
                <button 
                  onClick={handleEditProfile}
                  className="btn btn-secondary flex items-center gap-2 px-6"
                >
                  <Settings size={18} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    className={`btn flex items-center gap-2 px-6 ${
                      profile?.isFollowing ? 'btn-secondary' : 'btn-gradient'
                    }`}
                  >
                    {followMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : profile?.isFollowing ? (
                      <>
                        <UserMinus size={18} />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    className="btn btn-secondary flex items-center gap-2 px-6"
                  >
                    <MessageCircle size={18} />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            {/* Username & Full Name */}
            <div>
              <h1 className="text-2xl font-bold mb-1">{profile?.username}</h1>
              {profile?.fullName && (
                <p className="text-gray-400">{profile.fullName}</p>
              )}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                >
                  <LinkIcon size={16} />
                  <span>{profile.website}</span>
                </a>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Joined {joinedDate}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4 border-t border-dark-800">
              <div className="text-center">
                <div className="text-xl font-bold">{profile?.postsCount || 0}</div>
                <div className="text-sm text-gray-400">Posts</div>
              </div>
              <button
                onClick={handleShowFollowers}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <div className="text-xl font-bold">{profile?.followersCount || 0}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </button>
              <button
                onClick={handleShowFollowing}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <div className="text-xl font-bold">{profile?.followingCount || 0}</div>
                <div className="text-sm text-gray-400">Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex justify-center border-b border-dark-800">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-colors font-semibold ${
              activeTab === 'posts'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-dark-700'
            }`}
          >
            <Grid size={20} />
            <span>POSTS</span>
          </button>
          
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-colors font-semibold ${
                activeTab === 'saved'
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-dark-700'
              }`}
            >
              <Bookmark size={20} />
              <span>SAVED</span>
            </button>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {currentLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : currentPosts && currentPosts.length > 0 ? (
        <div className="space-y-6">
          {currentPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={handleModalUpdate}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center bg-gradient-to-br from-dark-900 to-black border border-dark-800">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'posts' ? (
              <Camera size={40} className="text-gray-400" />
            ) : (
              <BookMarked size={40} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {activeTab === 'posts' ? 'No posts yet' : 'No saved posts'}
          </h3>
          <p className="text-gray-400">
            {activeTab === 'posts' 
              ? 'Share your first post to get started' 
              : 'Posts you save will appear here'}
          </p>
        </div>
      )}

      {/* Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
        type={followersModalType}
      />

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          refetchProfile();
        }}
        profile={profile}
      />

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onUpdate={activeTab === "posts" ? refetchProfile : refetchSaved}
        />
      )}
    </div>
  );
};

export default ProfilePage;