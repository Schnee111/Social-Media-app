// front/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PostCard from '../components/post/PostCard';
import PostDetailModal from '../components/post/PostDetailModal';
import { Loader2 } from 'lucide-react';
import StoryFeed from '../components/story/StoryFeed';

const HomePage = () => {
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const pid = searchParams.get('postId');
    const cid = searchParams.get('commentId');
    if (pid) {
      setSelectedPostId(pid);
    }
    if (cid) {
      setSelectedCommentId(cid);
    }
  }, [searchParams]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await api.get('/posts/feed');
      return response.data.data;
    },
  });

  const handleOpenModal = (postId) => {
    setSelectedPostId(postId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-primary-500" size={40} />
        <p className="text-gray-400 text-sm">Loading your feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center border-2 border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-red-500 mb-2">Failed to load feed</h3>
          <p className="text-gray-400 mb-6">Something went wrong. Please try again.</p>
          <button onClick={() => refetch()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-6">
      {/* Story Feed Section */}
      <div className="mb-6">
        <StoryFeed />
      </div>

      {/* Posts Feed */}
      {data && data.length > 0 ? (
        <div className="space-y-6">
          {data.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={refetch}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center bg-gradient-to-br from-dark-900 to-black border border-dark-800">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-400 mb-4">
            Follow users to see their posts in your feed
          </p>
          <button 
            onClick={() => window.location.href = '/explore'} 
            className="btn btn-primary"
          >
            Explore Users
          </button>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          highlightCommentId={selectedCommentId}
          onClose={() => {
            setSelectedPostId(null);
            setSelectedCommentId(null);
          }}
          onUpdate={refetch}
        />
      )}
    </div>
  );
};

export default HomePage;