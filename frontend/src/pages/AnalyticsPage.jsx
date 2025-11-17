import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle,
  Activity,
  Award,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('trending');

  // ✅ ADD THIS: Helper to get full image URL
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  // Get trending posts
  const { data: trendingPosts, isLoading: trendingLoading } = useQuery({
    queryKey: ['analytics-trending'],
    queryFn: async () => {
      const response = await api.get('/analytics/trending');
      return response.data.data;
    },
    enabled: activeTab === 'trending',
  });

  // Get top users
  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => {
      const response = await api.get('/analytics/users');
      return response.data.data;
    },
    enabled: activeTab === 'users',
  });

  // Get top posts
  const { data: topPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['analytics-posts'],
    queryFn: async () => {
      const response = await api.get('/analytics/posts');
      return response.data.data;
    },
    enabled: activeTab === 'posts',
  });

  // Get daily activity
  const { data: dailyActivity, isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics-daily'],
    queryFn: async () => {
      const response = await api.get('/analytics/daily?days=7');
      return response.data.data;
    },
    enabled: activeTab === 'daily',
  });

  const isLoading = trendingLoading || usersLoading || postsLoading || dailyLoading;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">
          Statistik dan analisis menggunakan MongoDB Aggregation
        </p>
      </div>

      {/* Tabs */}
      <div className="card p-2 mb-6 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'trending'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <TrendingUp size={18} />
          <span className="font-semibold">Trending</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Users size={18} />
          <span className="font-semibold">Top Users</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'posts'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Award size={18} />
          <span className="font-semibold">Top Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'daily'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Activity size={18} />
          <span className="font-semibold">Daily Activity</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
      ) : (
        <>
          {/* Trending Posts */}
          {activeTab === 'trending' && (
            <div>
              <div className="card p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-primary-500" size={24} />
                  <div>
                    <h2 className="text-xl font-bold">🔥 Trending Posts</h2>
                    <p className="text-sm text-gray-400">
                      Posts dengan engagement tertinggi dalam 24 jam terakhir
                    </p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 font-mono">
                    MongoDB Aggregation: $lookup + $addFields + $sort + $limit
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {trendingPosts && trendingPosts.length > 0 ? (
                  trendingPosts.map((post, index) => (
                    <div key={post._id} className="card p-6">
                      <div className="flex gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            index === 0 ? 'bg-yellow-500 text-dark-900' :
                            index === 1 ? 'bg-gray-400 text-dark-900' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-dark-800 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Link to={`/profile/${post.user._id}`}>
                              <div className="avatar w-10 h-10 bg-dark-800">
                                {post.user.avatar ? (
                                  <img 
                                    src={getImageUrl(post.user.avatar)} 
                                    alt={post.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold">
                                    {post.user.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <div>
                              <Link 
                                to={`/profile/${post.user._id}`}
                                className="font-semibold hover:text-primary-500 transition-colors"
                              >
                                {post.user.username}
                              </Link>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { 
                                  addSuffix: true,
                                  locale: id 
                                })}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-300 mb-4">{post.content}</p>

                          {/* ✅ FIXED: Add getImageUrl */}
                          {post.image && (
                            <img 
                              src={getImageUrl(post.image)} 
                              alt="Post" 
                              className="rounded-lg mb-4 max-h-96 w-full object-cover"
                              onError={(e) => {
                                console.error('Image load error:', post.image);
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23262626"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23666"%3EImage not found%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Heart className="text-red-500" size={18} />
                              <span className="font-semibold">{post.recentLikesCount}</span>
                              <span className="text-sm text-gray-400">likes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="text-blue-500" size={18} />
                              <span className="font-semibold">{post.recentCommentsCount}</span>
                              <span className="text-sm text-gray-400">comments</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <BarChart3 className="text-primary-500" size={18} />
                              <span className="font-semibold text-primary-500">
                                {post.trendingScore}
                              </span>
                              <span className="text-sm text-gray-400">score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card p-12 text-center">
                    <p className="text-gray-400">Belum ada trending posts</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Users */}
          {activeTab === 'users' && (
            <div>
              <div className="card p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-primary-500" size={24} />
                  <div>
                    <h2 className="text-xl font-bold">👑 Top Users</h2>
                    <p className="text-sm text-gray-400">
                      User dengan followers terbanyak
                    </p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 font-mono">
                    MongoDB Aggregation: $lookup + $addFields + $sort + $limit
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topUsers && topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user._id}`}
                      className="card p-6 hover:bg-dark-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-dark-900' :
                          index === 1 ? 'bg-gray-400 text-dark-900' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-dark-800 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Avatar - ✅ FIXED */}
                        <div className="avatar-ring">
                          <div className="avatar w-16 h-16 bg-dark-800">
                            {user.avatar ? (
                              <img 
                                src={getImageUrl(user.avatar)} 
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{user.username}</h3>
                          {user.bio && (
                            <p className="text-sm text-gray-400 line-clamp-1">{user.bio}</p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex gap-4 mt-2 text-sm">
                            <div>
                              <span className="font-semibold">{user.postsCount}</span>
                              <span className="text-gray-400 ml-1">posts</span>
                            </div>
                            <div>
                              <span className="font-semibold text-primary-500">
                                {user.followersCount}
                              </span>
                              <span className="text-gray-400 ml-1">followers</span>
                            </div>
                            <div>
                              <span className="font-semibold">{user.followingCount}</span>
                              <span className="text-gray-400 ml-1">following</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="card p-12 text-center col-span-2">
                    <p className="text-gray-400">Belum ada data users</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Posts */}
          {activeTab === 'posts' && (
            <div>
              <div className="card p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="text-primary-500" size={24} />
                  <div>
                    <h2 className="text-xl font-bold">🏆 Top Posts</h2>
                    <p className="text-sm text-gray-400">
                      Posts dengan engagement tertinggi sepanjang masa
                    </p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 font-mono">
                    MongoDB Aggregation: $lookup + $unwind + $addFields + $sort
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {topPosts && topPosts.length > 0 ? (
                  topPosts.map((post, index) => (
                    <div key={post._id} className="card p-6">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-500 text-dark-900' :
                          index === 1 ? 'bg-gray-400 text-dark-900' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-dark-800 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Link to={`/profile/${post.user?._id}`}>
                              <div className="avatar w-10 h-10 bg-dark-800">
                                {post.user?.avatar ? (
                                  <img 
                                    src={getImageUrl(post.user.avatar)} 
                                    alt={post.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold">
                                    {post.user?.username?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <Link 
                              to={`/profile/${post.user?._id}`}
                              className="font-semibold hover:text-primary-500"
                            >
                              {post.user?.username}
                            </Link>
                          </div>

                          <p className="text-gray-300 mb-4">{post.content}</p>

                          {/* ✅ FIXED: Add getImageUrl for post images */}
                          {post.image && (
                            <img 
                              src={getImageUrl(post.image)} 
                              alt="Post" 
                              className="rounded-lg mb-4 max-h-96 w-full object-cover"
                              onError={(e) => {
                                console.error('Image load error:', post.image);
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23262626"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23666"%3EImage not found%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          )}

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Heart className="text-red-500" size={18} />
                              <span className="font-semibold">{post.likesCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="text-blue-500" size={18} />
                              <span className="font-semibold">{post.commentsCount}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <BarChart3 className="text-primary-500" size={18} />
                              <span className="font-semibold text-primary-500">
                                {post.engagement}
                              </span>
                              <span className="text-sm text-gray-400">engagement</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card p-12 text-center">
                    <p className="text-gray-400">Belum ada data posts</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Activity - No images here */}
          {activeTab === 'daily' && (
            <div>
              <div className="card p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="text-primary-500" size={24} />
                  <div>
                    <h2 className="text-xl font-bold">📈 Daily Activity</h2>
                    <p className="text-sm text-gray-400">
                      Aktivitas harian dalam 7 hari terakhir
                    </p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 font-mono">
                    MongoDB Aggregation: $match + $group + $lookup + $dateToString
                  </p>
                </div>
              </div>

              <div className="card p-6">
                {dailyActivity && dailyActivity.length > 0 ? (
                  <div className="space-y-4">
                    {dailyActivity.map((day) => {
                      const maxPosts = Math.max(...dailyActivity.map(d => d.postsCount));
                      const maxLikes = Math.max(...dailyActivity.map(d => d.likesCount));
                      const maxComments = Math.max(...dailyActivity.map(d => d.commentsCount));

                      return (
                        <div key={day.date} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{day.date}</span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-400">
                                {day.postsCount} posts
                              </span>
                              <span className="text-gray-400">
                                {day.likesCount} likes
                              </span>
                              <span className="text-gray-400">
                                {day.commentsCount} comments
                              </span>
                            </div>
                          </div>

                          {/* Progress Bars */}
                          <div className="space-y-2">
                            {/* Posts Bar */}
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-20">Posts</span>
                              <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${(day.postsCount / maxPosts) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold w-8 text-right">
                                {day.postsCount}
                              </span>
                            </div>

                            {/* Likes Bar */}
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-20">Likes</span>
                              <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500 rounded-full transition-all"
                                  style={{ width: `${(day.likesCount / maxLikes) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold w-8 text-right">
                                {day.likesCount}
                              </span>
                            </div>

                            {/* Comments Bar */}
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-20">Comments</span>
                              <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full transition-all"
                                  style={{ width: `${(day.commentsCount / maxComments) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold w-8 text-right">
                                {day.commentsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Belum ada data aktivitas</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;