import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Loader, MessageCircle, Edit3, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const ConversationsList = () => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams();
  const { socket, onlineUsers, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ ADD: Better socket listener
  useEffect(() => {
    if (!socket) return;

    console.log('📡 Setting up conversation listeners');

    const handleNewMessage = (messageData) => {
      console.log('🔔 New message in conversations:', messageData);
      fetchConversations(); // Refresh conversation list
    };

    socket.on('receive-message', handleNewMessage);

    return () => {
      console.log('🧹 Cleaning up conversation listeners');
      socket.off('receive-message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    fetchConversations();
    fetchSuggestedUsers();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations/list');
      setConversations(data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const { data } = await api.get('/users/suggestions');
      setSuggestedUsers(data.data);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = suggestedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Loading state sekarang di dalam container yang proper
  if (loading) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Header tetap ada saat loading */}
        <div className="p-4 border-b border-dark-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
        </div>
        
        {/* Loading di tengah area yang tersisa */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <Loader className="animate-spin text-primary-500 mb-3" size={32} />
            <p className="text-gray-400 text-sm">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
        {filteredConversations.length > 0 && (
          <div className="px-2 py-2">
            {filteredConversations.map((conv) => {
              const isOnline = onlineUsers.has(conv.user._id);
              const hasUnread = conv.unreadCount > 0;
              const isActive = activeUserId === conv.user._id;
              
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/messages/${conv.user._id}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                    isActive 
                      ? 'bg-dark-800 border-l-2 border-primary-500' 
                      : 'hover:bg-dark-800'
                  }`}
                >
                  {/* Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <div className={`avatar w-12 h-12 ${hasUnread ? 'ring-2 ring-primary-500' : ''} bg-dark-800`}>
                      {conv.user.avatar ? (
                        <img 
                          src={getMediaUrl(conv.user.avatar)} 
                          alt={conv.user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-semibold">
                          {conv.user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Online Indicator */}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-900"></div>
                    )}
                    {/* Unread Badge */}
                    {hasUnread && !isActive && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-semibold truncate text-sm ${hasUnread && !isActive ? 'text-white' : 'text-gray-300'}`}>
                        {conv.user.username}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-xs truncate ${
                        hasUnread && !isActive ? 'text-white font-medium' : 'text-gray-400'
                      }`}>
                        {conv.lastMessage.content || '📎 Media'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggested Users */}
        {filteredSuggestions.length > 0 && (
          <div className="px-2 py-3">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              {searchQuery ? 'Search Results' : 'Suggested'}
            </h2>
            <div className="space-y-1">
              {filteredSuggestions.map((user) => {
                const isOnline = onlineUsers.has(user._id);
                
                return (
                  <div
                    key={user._id}
                    onClick={() => navigate(`/messages/${user._id}`)}
                    className="flex items-center gap-3 p-2.5 hover:bg-dark-800 rounded-xl cursor-pointer transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="avatar w-11 h-11 bg-dark-800">
                        {user.avatar ? (
                          <img 
                            src={getMediaUrl(user.avatar)} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900"></div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-sm text-gray-300 group-hover:text-white transition-colors">
                        {user.username}
                      </h3>
                      {user.bio && (
                        <p className="text-xs text-gray-500 truncate">{user.bio}</p>
                      )}
                    </div>

                    {/* Message Icon */}
                    <MessageCircle size={16} className="text-gray-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {conversations.length === 0 && suggestedUsers.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-gray-400 text-sm">
              Start a conversation with someone!
            </p>
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredConversations.length === 0 && filteredSuggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-400 text-sm">
              Try searching for a different name
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;