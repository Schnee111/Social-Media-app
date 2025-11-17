import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/post/PostCard';
import { Loader2, Search, Grid, Users } from 'lucide-react';
import { useState } from 'react';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'users'

  // Get all posts
  const { data: posts, isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['explore'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data.data;
    },
    enabled: activeTab === 'posts',
  });

  // Search users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await api.get(`/users/search?q=${searchQuery}`);
      return response.data.data;
    },
    enabled: activeTab === 'users' && searchQuery.length > 0,
  });

  const filteredPosts = posts?.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.userId.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = activeTab === 'posts' ? postsLoading : usersLoading;
  const error = activeTab === 'posts' ? postsError : usersError;

  if (isLoading && !searchQuery) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Gagal memuat data</p>
        <button onClick={() => activeTab === 'posts' ? refetchPosts() : null} className="btn btn-primary mt-4">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="card p-1 mb-4 flex gap-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'posts'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Grid size={18} />
          <span className="font-semibold">Posts</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Users size={18} />
          <span className="font-semibold">Users</span>
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'posts' ? 'Cari posts...' : 'Cari users...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        // Posts Grid
        <div className="space-y-4">
          {filteredPosts && filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post._id} post={post} onUpdate={refetchPosts} />
            ))
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-400 text-lg">
                {searchQuery ? 'Tidak ada hasil' : 'Belum ada posts'}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Users List
        <div className="space-y-2">
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <Link
                key={user._id}
                to={`/profile/${user._id}`}
                className="card p-4 flex items-center gap-4 hover:bg-dark-800 transition-colors"
              >
                {/* Avatar */}
                <div className="avatar w-12 h-12 bg-dark-800 flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-400 truncate">{user.bio}</p>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-400 text-lg">
                {searchQuery ? 'Tidak ada user ditemukan' : 'Ketik untuk mencari user'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;