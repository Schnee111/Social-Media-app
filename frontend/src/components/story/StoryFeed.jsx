import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StoryItem from './StoryItem';

const StoryFeed = () => {
  const { user: currentUser } = useAuth();
  
  const { data: feedData, isLoading, error, refetch } = useQuery({
    queryKey: ['storiesFeed'],
    queryFn: async () => {
      const response = await api.get('/stories/feed');
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 detik
    refetchInterval: 2 * 60 * 1000, // Auto refetch setiap 2 menit
    refetchOnWindowFocus: true, // Refetch saat window focus
    enabled: !!currentUser
  });

  // Ambil status story sendiri
  const { data: myStories, isLoading: isMyStoriesLoading, refetch: refetchMyStories } = useQuery({
    queryKey: ['myStories'],
    queryFn: async () => {
      const response = await api.get('/stories/my');
      return response.data.data;
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const hasMyActiveStories = myStories?.length > 0;

  if (!currentUser) return null;
  if (error) return null; 

  // Inisialisasi daftar feed
  let sortedFeed = [];
  
  // Story sendiri
  const myFeedGroup = feedData?.find(g => g.user._id === currentUser._id);
  const myHasUnviewed = myFeedGroup ? myFeedGroup.hasUnviewed : false;
  
  sortedFeed.push({
    user: currentUser,
    hasUnviewed: myHasUnviewed, 
    isOwnStory: true,
    hasActiveStories: hasMyActiveStories,
  });
  
  // Story user lain (exclude diri sendiri)
  const otherStories = feedData ? feedData.filter(g => g.user._id !== currentUser._id) : [];
  
  // Sort: Unviewed dulu
  const sortedOthers = [...otherStories].sort((a, b) => {
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return 0;
  });
  
  sortedFeed = sortedFeed.concat(sortedOthers);

  const isLoadingTotal = isLoading || isMyStoriesLoading;

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-dark-800">
        <h2 className="text-sm font-semibold text-gray-300">Stories</h2>
      </div>
      
      {isLoadingTotal ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-500" size={28} />
        </div>
      ) : sortedFeed.length > 0 ? (
        <div className="px-4 py-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900 pb-2">
            {sortedFeed.map((group) => (
              <StoryItem
                key={group.user._id}
                user={group.user}
                hasUnviewed={group.hasUnviewed}
                isOwnStory={group.isOwnStory}
                hasActiveStories={group.hasActiveStories}
                onUpdate={() => {
                  refetch();
                  refetchMyStories();
                }}
              />
            ))}
          </div>
          
          {/* Helper text */}
          {sortedFeed.length === 1 && sortedFeed[0].isOwnStory && !hasMyActiveStories && (
            <div className="text-center py-4 mt-2 border-t border-dark-800">
              <p className="text-gray-500 text-sm">
                Follow users to see their stories
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📖</span>
          </div>
          <p className="text-gray-400 text-sm">No stories available</p>
        </div>
      )}
    </div>
  );
};

export default StoryFeed;