import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { X, Loader2, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import CommentItem from '../comment/CommentItem';

// Helper to get full media URL
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const PostDetailModal = ({ postId, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await api.get(`/posts/${postId}`);
      return response.data.data;
    },
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/comments/post/${postId}`);
      return response.data.data;
    },
    enabled: !!postId,
  });

  const allMedia = post?.images && post.images.length > 0 
    ? post.images 
    : post?.image 
    ? [post.image] 
    : [];

  const hasMultipleMedia = allMedia.length > 1;

  const handlePrevMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const isVideo = (url) => {
    return url.toLowerCase().match(/\.(mp4|mov|avi|webm)$/);
  };

  // Optimized: Create comment dengan optimistic update
  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/comments/post/${postId}`, data);
      return response.data;
    },
    onMutate: async (newCommentData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['comments', postId]);
      await queryClient.cancelQueries(['post', postId]);

      // Snapshot previous values
      const previousComments = queryClient.getQueryData(['comments', postId]);
      const previousPost = queryClient.getQueryData(['post', postId]);

      // Optimistically update comments
      const optimisticComment = {
        _id: 'temp-' + Date.now(),
        content: newCommentData.content,
        userId: currentUser,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
        repliesCount: 0,
      };

      queryClient.setQueryData(['comments', postId], (old) => 
        old ? [...old, optimisticComment] : [optimisticComment]
      );

      // Optimistically update post comment count
      queryClient.setQueryData(['post', postId], (old) => 
        old ? { ...old, commentsCount: (old.commentsCount || 0) + 1 } : old
      );

      return { previousComments, previousPost };
    },
    onSuccess: () => {
      toast.success('Comment posted');
      setNewComment('');
      
      // ✅ Refetch only necessary queries
      queryClient.invalidateQueries(['comments', postId]);
      queryClient.invalidateQueries(['post', postId]);
      
      // Update explorer in background (no await)
      queryClient.invalidateQueries(['explorePosts'], { refetchType: 'none' });
      
      onUpdate?.();
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(error.response?.data?.error || 'Failed to post comment');
    },
  });

  // ✅ Optimized: Like dengan optimistic update
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['post', postId]);
      
      const previousPost = queryClient.getQueryData(['post', postId]);
      
      // Optimistically update
      queryClient.setQueryData(['post', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: !old.isLiked,
          likesCount: old.isLiked ? old.likesCount - 1 : old.likesCount + 1,
        };
      });
      
      return { previousPost };
    },
    onSuccess: () => {
      // Update explorer data in background
      queryClient.invalidateQueries(['explorePosts'], { refetchType: 'none' });
      queryClient.invalidateQueries(['posts'], { refetchType: 'none' });
      onUpdate?.();
    },
    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(error.response?.data?.error || 'Failed to like post');
    },
  });

  // ✅ Optimized: Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${postId}/save`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['post', postId]);
      
      const previousPost = queryClient.getQueryData(['post', postId]);
      
      queryClient.setQueryData(['post', postId], (old) => {
        if (!old) return old;
        return { ...old, isSaved: !old.isSaved };
      });
      
      return { previousPost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedPosts'], { refetchType: 'none' });
      onUpdate?.();
    },
    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(error.response?.data?.error || 'Failed to save post');
    },
  });

  // Delete mutation (no optimization needed)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      toast.success('Post deleted successfully');
      onClose();
      queryClient.invalidateQueries(['explorePosts']);
      queryClient.invalidateQueries(['posts']);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete post');
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    createCommentMutation.mutate({ 
      content: newComment.trim(),
      parentId: null
    });
  };

  // ✅ Handler untuk child component updates (like comment, delete comment, dll)
  const handleChildUpdate = () => {
    queryClient.invalidateQueries(['comments', postId]);
    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['explorePosts'], { refetchType: 'none' });
    onUpdate?.();
  };

  if (!post && !isLoading) {
    return null;
  }

  const isOwnPost = currentUser?._id === post?.userId._id;
  const MAX_CONTENT_LENGTH = 150;
  const isLongContent = post?.content.length > MAX_CONTENT_LENGTH;
  const displayContent = showFullContent || !isLongContent 
    ? post?.content 
    : post?.content.slice(0, MAX_CONTENT_LENGTH) + '...';

  const timeAgo = post ? formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  }) : '';

  const storiesFeed = queryClient.getQueryData(['storiesFeed']);
  const postUserStoryGroup = storiesFeed?.find(group => 
    group.user._id === post?.userId._id
  );
  const hasActiveStory = !!postUserStoryGroup;
  const hasUnviewed = postUserStoryGroup?.hasUnviewed || false;
  
  const getStoryRingClass = () => {
    if (!hasActiveStory) return ''; 
    return hasUnviewed
      ? 'p-0.5 bg-gradient-instagram' 
      : 'p-0.5 border-2 border-dark-700'; 
  };
  
  const ringClass = getStoryRingClass();

  const handleAvatarClick = (e) => {
    if (hasActiveStory) {
      e.preventDefault(); 
      onClose();
      navigate(`/stories/${post.userId._id}`);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white"
      >
        <X size={24} />
      </button>

      <div 
        className="relative w-full max-w-5xl h-[85vh] bg-black flex rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex justify-center items-center w-full">
            <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
        ) : post ? (
          <>
            {/* Left Side - Media Carousel */}
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {allMedia.length > 0 ? (
                <>
                  <div className="w-full h-full flex items-center justify-center">
                    {isVideo(allMedia[currentMediaIndex]) ? (
                      <video
                        key={currentMediaIndex}
                        src={getMediaUrl(allMedia[currentMediaIndex])}
                        controls
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(allMedia[currentMediaIndex])}
                        alt={`Post media ${currentMediaIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>

                  {hasMultipleMedia && (
                    <>
                      <button
                        onClick={handlePrevMedia}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ChevronLeft size={24} className="text-white" />
                      </button>

                      <button
                        onClick={handleNextMedia}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ChevronRight size={24} className="text-white" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                        {allMedia.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMediaIndex(index);
                            }}
                            className={`transition-all ${
                              index === currentMediaIndex
                                ? 'w-2.5 h-2.5 bg-white'
                                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                            } rounded-full`}
                          />
                        ))}
                      </div>

                      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium z-10">
                        {currentMediaIndex + 1}/{allMedia.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-dark-900 to-black p-8">
                  <div className="text-center max-w-md">
                    <div className="avatar w-16 h-16 bg-dark-800 mx-auto mb-4 ring-2 ring-primary-500/30">
                      {post.userId.avatar ? (
                        <img
                          src={getMediaUrl(post.userId.avatar)}
                          alt={post.userId.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold">
                          {post.userId.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-primary-500 mb-3">
                      @{post.userId.username}
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Details & Comments */}
            <div className="w-[380px] bg-dark-900 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-800">
                <Link 
                  to={`/profile/${post.userId._id}`}
                  onClick={handleAvatarClick}
                  className="flex items-center gap-3"
                >
                  {hasActiveStory ? (
                    <div className={`avatar-ring ${ringClass}`}> 
                      <div className="avatar w-9 h-9 bg-dark-800 border-2 border-black">
                        {post.userId.avatar ? (
                          <img
                            src={getMediaUrl(post.userId.avatar)}
                            alt={post.userId.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold">
                            {post.userId.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="avatar w-9 h-9 bg-dark-800">
                      {post.userId.avatar ? (
                        <img
                          src={getMediaUrl(post.userId.avatar)}
                          alt={post.userId.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold">
                          {post.userId.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold hover:text-gray-300 transition-colors">
                      {post.userId.username}
                    </p>
                  </div>
                </Link>

                {isOwnPost && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-dark-800 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-44 bg-dark-800 rounded-lg p-1.5 space-y-1 z-20 shadow-xl border border-dark-700">
                          <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Caption */}
              {post.content && (
                <div className="px-4 py-3 border-b border-dark-800">
                  <p className="text-sm break-words">
                    <Link
                      to={`/profile/${post.userId._id}`}
                      className="font-semibold hover:text-gray-300 transition-colors"
                    >
                      {post.userId.username}
                    </Link>{' '}
                    <span className="text-gray-300">{displayContent}</span>
                    {isLongContent && (
                      <button
                        onClick={() => setShowFullContent(!showFullContent)}
                        className="text-sm text-gray-400 hover:text-white font-semibold ml-1"
                      >
                        {showFullContent ? 'less' : 'more'}
                      </button>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{timeAgo}</p>
                </div>
              )}

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      onUpdate={handleChildUpdate}
                      isReply={false}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="border-t border-dark-800">
                <div className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className={`hover:opacity-70 transition-all ${post.isLiked ? 'text-red-500' : ''}`}
                  >
                    <Heart
                      size={24}
                      fill={post.isLiked ? 'currentColor' : 'none'}
                    />
                  </button>

                  <button className="hover:opacity-70 transition-all">
                    <MessageCircle size={24} />
                  </button>

                  <button className="hover:opacity-70 transition-all">
                    <Send size={24} />
                  </button>

                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className={`ml-auto hover:opacity-70 transition-all ${post.isSaved ? 'text-yellow-500' : ''}`}
                  >
                    <Bookmark
                      size={24}
                      fill={post.isSaved ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                {post.likesCount > 0 && (
                  <div className="px-4 pb-2">
                    <p className="text-sm font-semibold">
                      {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                    </p>
                  </div>
                )}

                {/* Comment Input */}
                <form onSubmit={handleSubmitComment} className="px-4 pb-4 flex items-center gap-2 border-t border-dark-800 pt-3">
                  <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={getMediaUrl(currentUser.avatar)}
                        alt={currentUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold">
                        {currentUser?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm py-2 focus:outline-none"
                    disabled={createCommentMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={createCommentMutation.isPending || !newComment.trim()}
                    className="text-primary-500 font-semibold text-sm disabled:opacity-50 hover:text-primary-400 transition-colors"
                  >
                    {createCommentMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      'Post'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center w-full">
            <p className="text-gray-400">Post not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal;