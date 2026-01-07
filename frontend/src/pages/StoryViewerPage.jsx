import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, X, Trash2, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// Utility functions
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;
    if (mediaPath.startsWith('http')) return mediaPath;
    return `${API_URL}${mediaPath}`;
};
const isVideo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.avi');
};

const StoryViewerPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const videoRef = useRef(null);

  const defaultDuration = 5000;
  const [currentDuration, setCurrentDuration] = useState(defaultDuration); 

  // Fetch Feed Data
  const { data: feedData } = useQuery({
    queryKey: ['storiesFeed'],
    queryFn: async () => {
      const response = await api.get('/stories/feed');
      return response.data.data;
    },
    staleTime: 60 * 1000, 
    refetchInterval: 5 * 60 * 1000, 
    enabled: !!currentUser,
  });

  const userOrder = feedData ? feedData.map(g => g.user._id) : [];
  const currentUserIndexInFeed = userOrder.indexOf(userId);
  const isFirstUser = currentUserIndexInFeed <= 0;
  const isLastUser = currentUserIndexInFeed >= userOrder.length - 1;

  // Fetch stories
  const { data: userStories, isLoading, error } = useQuery({
    queryKey: ['userStories', userId],
    queryFn: async () => {
      const response = await api.get(`/stories/user/${userId}`);
      return response.data.data;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
  
  const currentStory = userStories?.[currentStoryIndex];
  const isOwnStory = currentStory?.userId?._id === currentUser?._id;
  const mediaUrl = getMediaUrl(currentStory?.media);
  const isVideoMedia = isVideo(mediaUrl);

  // Mutations
  const viewStoryMutation = useMutation({
    mutationFn: async (storyId) => { 
      await api.post(`/stories/${storyId}/view`); 
    },
    onSuccess: () => { 
      queryClient.invalidateQueries(['storiesFeed']);
      queryClient.invalidateQueries(['userStories', userId]);
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId) => { 
      await api.delete(`/stories/${storyId}`); 
    },
    onSuccess: () => {
        toast.success('Story deleted successfully');
        
        if (userStories.length === 1) {
            handleNextUser(); 
        } else {
            setCurrentStoryIndex(prev => Math.min(prev, userStories.length - 2)); 
            queryClient.invalidateQueries(['userStories', userId]); 
        }
        queryClient.invalidateQueries(['storiesFeed']);
        setShowViewers(false); 
    },
    onError: (error) => { 
      toast.error(error.error || 'Failed to delete story'); 
    }
  });

  // Navigation functions
  const handleNextUser = useCallback(() => {
    if (!isLastUser) {
      const nextUserId = userOrder[currentUserIndexInFeed + 1];
      navigate(`/stories/${nextUserId}`);
      setCurrentStoryIndex(0); 
    } else {
      navigate('/');
    }
  }, [isLastUser, currentUserIndexInFeed, userOrder, navigate]);
  
  const handlePrevUser = useCallback(() => {
    if (!isFirstUser) {
      const prevUserId = userOrder[currentUserIndexInFeed - 1];
      navigate(`/stories/${prevUserId}`);
      setCurrentStoryIndex(0); 
    }
  }, [isFirstUser, currentUserIndexInFeed, userOrder, navigate]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < (userStories?.length || 0) - 1) {
      setCurrentStoryIndex(prev => prev + 1); 
    } else {
      handleNextUser(); 
    }
  }, [currentStoryIndex, userStories, handleNextUser]);

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  // Autoplay logic
  useEffect(() => {
    if (isLoading || !currentStory) return;
    
    // Mark as viewed (only once per story)
    if (!isOwnStory && !currentStory.hasViewed && currentStory._id) {
        viewStoryMutation.mutate(currentStory._id);
    }
    
    let timer;
    if (!isPaused) {
        timer = setTimeout(() => {
            handleNext();
        }, currentDuration);
    }

    return () => clearTimeout(timer);

  }, [currentStoryIndex, isPaused, currentDuration, handleNext, isLoading, currentStory, isOwnStory]);

  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
        const videoDurationMs = videoRef.current.duration * 1000;
        setCurrentDuration(videoDurationMs);
        if (!isPaused) {
            videoRef.current.play();
        }
    } else {
        setCurrentDuration(defaultDuration);
    }
  }, [isPaused]);
  
  useEffect(() => {
    setIsPaused(false);
    if (currentStory) {
        setCurrentDuration(defaultDuration); 
    }
  }, [currentStoryIndex, userId, currentStory]);
  
  const togglePause = () => {
    setIsPaused(prev => {
        const newState = !prev;
        if (videoRef.current) {
            if (newState) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
        return newState;
    });
  };

  if (isLoading || !feedData) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[100]">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }
  
  if (error || !currentStory) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-[100] text-white">
        <div className="bg-dark-900 rounded-xl p-8 max-w-md text-center">
          <p className="mb-4">Story not found or has expired.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
              Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Story Viewers Modal
  const StoryViewersModal = ({ story, onClose }) => {
    const { data: viewers, isLoading: viewersLoading, error: viewersError } = useQuery({
      queryKey: ['storyViewers', story._id],
      queryFn: async () => {
        const response = await api.get(`/stories/${story._id}/viewers`);
        return response.data.data;
      },
      enabled: showViewers,
    });

    // Group viewers by userId to remove duplicates
    const uniqueViewers = viewers?.reduce((acc, viewer) => {
      const existingViewer = acc.find(v => v.userId._id === viewer.userId._id);
      if (!existingViewer) {
        acc.push(viewer);
      } else if (new Date(viewer.viewedAt) > new Date(existingViewer.viewedAt)) {
        // Keep the most recent view
        const index = acc.indexOf(existingViewer);
        acc[index] = viewer;
      }
      return acc;
    }, []);

    return (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex justify-center items-end transition-opacity duration-300"
          onClick={(e) => { 
            if (e.target === e.currentTarget) {
                onClose();
            }
          }}
        >
            <div 
              className="w-full max-w-md bg-dark-900 shadow-2xl rounded-t-xl flex flex-col transition-all duration-300 transform translate-y-0"
              style={{ height: '70vh' }} 
            >
                <div className="flex justify-between items-center p-4 pt-3 flex-shrink-0 border-b border-dark-800">
                    <h3 className="text-xl font-bold">Viewers ({uniqueViewers?.length || 0})</h3>
                    <button onClick={onClose} className="btn-ghost p-2">
                        <X size={24} />
                    </button>
                </div>
                
                {viewersLoading ? (
                    <div className="flex justify-center py-8 flex-1">
                        <Loader2 className="animate-spin text-primary-500" size={24} />
                    </div>
                ) : viewersError ? (
                    <p className="text-red-500 p-4">Failed to load viewers</p>
                ) : uniqueViewers && uniqueViewers.length > 0 ? (
                    <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900"> 
                        <div className="space-y-3 pt-4">
                            {uniqueViewers.map(viewer => (
                                <Link 
                                    key={viewer.userId._id} 
                                    to={`/profile/${viewer.userId._id}`}
                                    onClick={onClose} 
                                    className="flex items-center gap-3 hover:bg-dark-800 p-2 rounded-lg transition-colors"
                                >
                                    <div className="avatar w-10 h-10 bg-dark-800">
                                        {viewer.userId.avatar ? (
                                          <img 
                                            src={getMediaUrl(viewer.userId.avatar)} 
                                            alt={viewer.userId.username} 
                                            className="w-full h-full object-cover" 
                                          />
                                        ) : (
                                          <span className="text-sm font-semibold">
                                            {viewer.userId.username.charAt(0).toUpperCase()}
                                          </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{viewer.userId.username}</p>
                                        <p className="text-xs text-gray-400">
                                          Viewed {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Eye size={24} className="text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm">No views yet</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex justify-center items-center z-[100] text-white">
        
        <div className="w-full h-full max-w-lg flex items-center justify-center relative"> 

            {/* Button Prev User */}
            <button
                onClick={handlePrevUser}
                disabled={isFirstUser}
                className={`flex-shrink-0 p-3 z-50 transition-all bg-dark-800/50 hover:bg-dark-700/50 rounded-full ${
                    !isFirstUser ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <ArrowLeft size={24} /> 
            </button>
            
            {/* Story Frame */}
            <div className="w-full h-full max-w-md bg-black relative mx-2 rounded-xl overflow-hidden shadow-2xl">
                
                {/* Background Image/Video */}
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                    {isVideoMedia ? (
                        <video
                            ref={videoRef}
                            key={currentStoryIndex}
                            src={mediaUrl}
                            autoPlay={!isPaused}
                            onCanPlayThrough={handleVideoLoad}
                            onLoadedData={handleVideoLoad}
                            onEnded={handleNext}
                            onClick={togglePause}
                            className="w-full h-full object-contain cursor-pointer"
                            loop={false}
                        />
                    ) : (
                        <img
                            key={currentStoryIndex}
                            src={mediaUrl}
                            alt="Story Media"
                            className="w-full h-full object-contain"
                            onClick={togglePause}
                        />
                    )}
                </div>
                
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-30">
                {userStories.map((story, index) => {
                    const isCompleted = index < currentStoryIndex;
                    const isActive = index === currentStoryIndex;
                    
                    return (
                        <div 
                        key={story._id}
                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                        >
                        <div
                            key={currentStoryIndex === index ? 'active' : `done-${index}`} 
                            className={`h-full bg-white story-progress-animation ${
                                isActive ? 'story-progress-animation' : ''
                            } ${isPaused ? 'paused' : 'running'}`}
                            style={{ 
                                transform: isCompleted ? 'translateX(0)' : 'translateX(-100%)',
                                animationDuration: isActive ? `${currentDuration}ms` : '0ms',
                                width: '100%', 
                                animationName: isActive ? 'story-progress' : 'none'
                            }}
                        />
                        </div>
                    )}
                )}
                </div>
                
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-3">
                        <Link to={`/profile/${currentStory.userId._id}`}>
                            <div className="avatar w-10 h-10 bg-dark-800 border-2 border-white">
                                {currentStory.userId.avatar ? (
                                    <img 
                                      src={getMediaUrl(currentStory.userId.avatar)} 
                                      alt={currentStory.userId.username} 
                                      className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="text-sm font-semibold">
                                      {currentStory.userId.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <div>
                            <Link 
                              to={`/profile/${currentStory.userId._id}`} 
                              className="font-semibold text-white hover:underline"
                            >
                                {currentStory.userId.username}
                            </Link>
                            <p className="text-xs text-gray-300">
                                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <button 
                      onClick={() => navigate('/')} 
                      className="btn-ghost p-2 text-white/70 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                {/* Caption */}
                {currentStory.caption && (
                    <div className="absolute bottom-20 left-0 right-0 px-4 text-center z-30">
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 inline-block max-w-md">
                            <p className="text-white text-sm font-medium">{currentStory.caption}</p>
                        </div>
                    </div>
                )}
                
                {/* Footer */}
                {isOwnStory ? (
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center items-center z-30"> 
                        <div className="flex items-center gap-4 bg-black/70 backdrop-blur-sm p-3 px-6 rounded-full">
                            <button 
                                onClick={() => {
                                    setShowViewers(true);
                                    setIsPaused(true);
                                }} 
                                className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors"
                            >
                                <Eye size={20} />
                            </button>
                            
                            <div className="h-5 w-px bg-gray-600"></div> 
                            
                            <button 
                                onClick={() => deleteStoryMutation.mutate(currentStory._id)}
                                disabled={deleteStoryMutation.isPending}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                                {deleteStoryMutation.isPending ? (
                                  <Loader2 size={20} className="animate-spin" />
                                ) : (
                                  <Trash2 size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Navigation Click Zones */}
                <div className="absolute inset-0 flex justify-between z-20">
                <div 
                    className="w-1/3 h-full cursor-pointer" 
                    onClick={handlePrev} 
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => togglePause()} 
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => togglePause()}
                />
                <div 
                    className="w-1/3 h-full cursor-pointer"
                    onClick={togglePause}
                />
                <div 
                    className="w-1/3 h-full cursor-pointer" 
                    onClick={handleNext}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => togglePause()} 
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => togglePause()}
                />
                </div>
            </div>

            {/* Button Next User */}
            <button
                onClick={handleNextUser} 
                disabled={isLastUser}
                className={`flex-shrink-0 p-3 z-50 transition-all bg-dark-800/50 hover:bg-dark-700/50 rounded-full ${
                    !isLastUser ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <ArrowRight size={24} /> 
            </button>
        </div>
        
        {/* Story Viewers Modal */}
        {showViewers && (
          <StoryViewersModal 
            story={currentStory} 
            onClose={() => { 
              setShowViewers(false); 
              setIsPaused(false); 
            }} 
          />
        )}
        
        <style>{`
          @keyframes story-progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
          }
          .story-progress-animation {
            animation-name: story-progress;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            transform: translateX(-100%); 
          }
          .running.story-progress-animation {
            animation-play-state: running;
          }
          .paused.story-progress-animation {
            animation-play-state: paused;
          }
        `}</style>
    </div>
  );
};

export default StoryViewerPage;