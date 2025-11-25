import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Send, X } from 'lucide-react';
import CommentItem from './CommentItem';

// Helper to get full media URL
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const CommentSection = ({ postId, onCommentUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef(null);
  const mentionBoxRef = useRef(null);

  // Fetch comments
  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/comments/post/${postId}`);
      return response.data.data;
    },
  });

  // Fetch following users for mentions (when no search query)
  const { data: followingUsers, isLoading: followingLoading } = useQuery({
    queryKey: ['followingForMentions', user?._id],
    queryFn: async () => {
      const response = await api.get(`/users/${user._id}/following`);
      return response.data.data;
    },
    enabled: showMentions && !mentionSearch && !!user?._id,
  });

  // Search users for mentions (when typing after @)
  const { data: searchUsers, isLoading: searchLoading } = useQuery({
    queryKey: ['searchForMentions', mentionSearch],
    queryFn: async () => {
      if (!mentionSearch.trim()) return [];
      const response = await api.get(`/users/search?q=${mentionSearch}`);
      return response.data.data;
    },
    enabled: showMentions && mentionSearch.length > 0,
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/comments/post/${postId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Comment posted successfully');
      setNewComment('');
      refetch();
      onCommentUpdate();
    },
    onError: (error) => {
      toast.error(error.error || 'Failed to post comment');
    },
  });

  // Get mention suggestions - prioritize search results if searching
  const mentionSuggestions = mentionSearch 
    ? (searchUsers || [])
    : (followingUsers || []);

  const isMentionsLoading = mentionSearch ? searchLoading : followingLoading;

  // Detect @ symbol and show mention dropdown
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(cursorPos);

    // Find last @ symbol before cursor
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @, if yes, close mentions
      if (textAfterAt.includes(' ')) {
        setShowMentions(false);
        setMentionSearch('');
      } else {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setSelectedMentionIndex(0);
      }
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  // Handle mention selection
  const selectMention = (username) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Replace @search with @username
    const newText = 
      newComment.substring(0, lastAtIndex) + 
      `@${username} ` + 
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtIndex + username.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e) => {
    if (!showMentions) return;

    // Allow typing if no suggestions yet
    if (mentionSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (showMentions && mentionSuggestions.length > 0) {
          e.preventDefault();
          if (mentionSuggestions[selectedMentionIndex]) {
            selectMention(mentionSuggestions[selectedMentionIndex].username);
          }
        }
        break;
      case 'Escape':
        setShowMentions(false);
        setMentionSearch('');
        break;
    }
  };

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionBoxRef.current && !mentionBoxRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowMentions(false);
        setMentionSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected mention into view
  useEffect(() => {
    if (mentionBoxRef.current && showMentions && mentionSuggestions.length > 0) {
      const selectedElement = mentionBoxRef.current.querySelector(`[data-index="${selectedMentionIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedMentionIndex, showMentions, mentionSuggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    createMutation.mutate({ 
      content: newComment.trim(),
      parentId: null
    });
  };

  return (
    <div className="border-t border-dark-800 pt-4 px-4 space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-start gap-3">
          <div className="avatar w-8 h-8 bg-dark-800 flex-shrink-0">
            {user?.avatar ? (
              <img
                src={getMediaUrl(user.avatar)}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment... (Type @ to mention)"
                className="input w-full text-sm py-2"
                disabled={createMutation.isPending}
              />
              
              {/* Mention Dropdown */}
              {showMentions && (
                <div 
                  ref={mentionBoxRef}
                  className="absolute bottom-full left-0 mb-2 w-full bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800"
                >
                  {/* Header */}
                  <div className="px-3 py-2 text-xs text-gray-400 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800 z-10">
                    <span>
                      {mentionSearch 
                        ? `Search: "${mentionSearch}"` 
                        : 'Your Following'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMentions(false);
                        setMentionSearch('');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {/* Loading State */}
                  {isMentionsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin text-primary-500" size={20} />
                    </div>
                  ) : mentionSuggestions && mentionSuggestions.length > 0 ? (
                    // User List
                    mentionSuggestions.map((suggestedUser, index) => (
                      <button
                        key={suggestedUser._id}
                        type="button"
                        data-index={index}
                        onClick={() => selectMention(suggestedUser.username)}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-dark-700 transition-colors ${
                          index === selectedMentionIndex ? 'bg-dark-700' : ''
                        }`}
                      >
                        <div className="avatar w-8 h-8 bg-dark-700 flex-shrink-0">
                          {suggestedUser.avatar ? (
                            <img
                              src={getMediaUrl(suggestedUser.avatar)}
                              alt={suggestedUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold">
                              {suggestedUser.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {suggestedUser.username}
                          </p>
                          {suggestedUser.fullName && (
                            <p className="text-xs text-gray-400 truncate">
                              {suggestedUser.fullName}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          @{suggestedUser.username}
                        </div>
                      </button>
                    ))
                  ) : (
                    // Empty State
                    <div className="px-3 py-6 text-center text-sm text-gray-400">
                      {mentionSearch 
                        ? 'No users found' 
                        : 'You are not following anyone yet'}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending || !newComment.trim()}
              className="btn btn-primary px-4 py-2 disabled:opacity-50 flex-shrink-0"
            >
              {createMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pb-2 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900 hover:scrollbar-thumb-dark-600">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onUpdate={() => {
                refetch();
                onCommentUpdate();
              }}
              isReply={false}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8 text-sm">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default CommentSection;