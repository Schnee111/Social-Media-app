import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader, MessageCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext'; // ✅ ADD
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ConversationsList = () => {
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket(); // ✅ ADD
  const [conversations, setConversations] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ LISTEN FOR NEW MESSAGES
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData) => {
      console.log('🔔 New message notification:', messageData);
      // Refresh conversations list
      fetchConversations();
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-400">Messages</h2>
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const isOnline = onlineUsers.has(conv.user._id); // ✅ CHECK ONLINE STATUS
              
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/messages/${conv.user._id}`)}
                  className="card hover:bg-dark-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="avatar w-14 h-14 bg-gradient-instagram">
                        {conv.user.avatar ? (
                          <img src={conv.user.avatar} alt={conv.user.username} />
                        ) : (
                          <span className="text-lg font-semibold">
                            {conv.user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* ✅ ONLINE INDICATOR */}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conv.user.username}</h3>
                        <span className="text-xs text-gray-500">
                          {conv.lastMessage && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                          {conv.lastMessage.content || '📎 Media'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Users */}
      {filteredSuggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-400">
            {searchQuery ? 'Search Results' : 'Suggested'}
          </h2>
          <div className="space-y-2">
            {filteredSuggestions.map((user) => {
              const isOnline = onlineUsers.has(user._id); // ✅ CHECK ONLINE STATUS
              
              return (
                <div
                  key={user._id}
                  onClick={() => navigate(`/messages/${user._id}`)}
                  className="card hover:bg-dark-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="avatar w-14 h-14 bg-gradient-instagram">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} />
                        ) : (
                          <span className="text-lg font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* ✅ ONLINE INDICATOR */}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.username}</h3>
                      {user.bio && (
                        <p className="text-sm text-gray-400 truncate">{user.bio}</p>
                      )}
                    </div>

                    {/* Message Icon */}
                    <MessageCircle size={20} className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {conversations.length === 0 && suggestedUsers.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
          <p className="text-gray-400">Start a conversation with someone!</p>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;