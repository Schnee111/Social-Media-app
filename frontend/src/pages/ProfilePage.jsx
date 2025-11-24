import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/post/PostCard';
import FollowersModal from '../components/user/FollowersModal';
import EditProfileModal from '../components/user/EditProfileModal'; // ✅ ADD
import { Loader2, Settings, Grid, Bookmark, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers');
  const [showEditModal, setShowEditModal] = useState(false); // ✅ ADD

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
        toast.success('Berhasil follow user');
      } else {
        toast.success('Berhasil unfollow user');
      }
    },
    onError: (error) => {
      toast.error(error.error || 'Gagal follow/unfollow user');
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

  // ✅ ADD: Handle edit profile
  const handleEditProfile = () => {
    setShowEditModal(true);
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card p-8 mb-6">
        <div className="flex items-start gap-8">
          {/* Avatar */}
          <div className="avatar-ring">
            <div className="avatar w-32 h-32 bg-dark-800">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">
                  {profile?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-2xl font-semibold">{profile?.username}</h1>
              
              {/* Action Buttons */}
              {isOwnProfile ? (
                <button 
                  onClick={handleEditProfile}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Settings size={18} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    className={`btn flex items-center gap-2 ${
                      profile?.isFollowing ? 'btn-secondary' : 'btn-primary'
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
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <MessageCircle size={18} />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-4">
              <div>
                <span className="font-semibold">{profile?.postsCount || 0}</span>
                <span className="text-gray-400 ml-1">posts</span>
              </div>
              <button
                onClick={handleShowFollowers}
                className="hover:text-white transition-colors text-left"
              >
                <span className="font-semibold">{profile?.followersCount || 0}</span>
                <span className="text-gray-400 ml-1">followers</span>
              </button>
              <button
                onClick={handleShowFollowing}
                className="hover:text-white transition-colors text-left"
              >
                <span className="font-semibold">{profile?.followingCount || 0}</span>
                <span className="text-gray-400 ml-1">following</span>
              </button>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-gray-300">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-800 mb-6">
        <div className="flex justify-center gap-12">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Grid size={20} />
            <span className="font-semibold">POSTS</span>
          </button>
          
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Bookmark size={20} />
              <span className="font-semibold">SAVED</span>
            </button>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {currentLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : currentPosts && currentPosts.length > 0 ? (
        <div className="space-y-4">
          {currentPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={activeTab === 'posts' ? refetchProfile : refetchSaved}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">
            {activeTab === 'posts' ? 'Belum ada posts' : 'Belum ada saved posts'}
          </p>
        </div>
      )}

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
        type={followersModalType}
      />

      {/* ✅ ADD: Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          refetchProfile();
        }}
        profile={profile}
      />
    </div>
  );
};

export default ProfilePage;