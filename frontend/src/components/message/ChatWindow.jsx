import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image, ArrowLeft, Loader, MoreVertical, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ChatWindow = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userId && currentUser) {
      console.log('📱 Loading chat with user:', userId);
      // ✅ FETCH USER INFO FIRST (independent dari messages)
      fetchUserInfo();
      fetchMessages();
    }
  }, [userId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ FIXED: Fetch user info langsung dari /users/:id
  const fetchUserInfo = async () => {
    try {
      setLoadingUser(true);
      console.log('👤 Fetching user info from /users/' + userId);
      const { data } = await api.get(`/users/${userId}`);
      console.log('✅ User info loaded:', data.data);
      
      // ✅ Handle both formats (user object or nested in data.user)
      const userData = data.data?.user || data.data;
      setOtherUser(userData);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      toast.error('Failed to load user info');
      setOtherUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      console.log('💬 Fetching messages from /messages/' + userId);
      const { data } = await api.get(`/messages/${userId}`);
      console.log('✅ Messages loaded:', data.data?.length || 0);
      setMessages(data.data || []);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      // Don't show error for empty conversation (404 or 500 with empty data)
      if (error.response?.status === 404 || error.response?.data?.data?.length === 0) {
        console.log('ℹ️ No messages yet, starting new conversation');
        setMessages([]);
      } else {
        toast.error('Failed to load messages');
      }
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedMedia) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('receiverId', userId);
      if (newMessage.trim()) {
        formData.append('content', newMessage);
      }
      if (selectedMedia) {
        formData.append('media', selectedMedia);
      }

      const { data } = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages([...messages, data.data]);
      setNewMessage('');
      setSelectedMedia(null);
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedMedia(file);
    }
  };

  // ✅ Show loading while waiting for currentUser
  if (!currentUser) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] bg-black">
        <Loader className="animate-spin mb-4" size={40} />
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // ✅ Show loading while fetching user info
  if (loadingUser) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] bg-black">
        <Loader className="animate-spin mb-4" size={40} />
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  // ✅ Show error if user not found
  if (!loadingUser && !otherUser) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] bg-black">
        <MessageCircle size={64} className="mb-4 text-gray-600" />
        <p className="text-gray-400 mb-2">User not found</p>
        <button onClick={() => navigate('/messages')} className="btn-primary mt-4">
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-dark-800 p-4 flex items-center justify-between bg-black">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="hover:bg-dark-800 p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div 
            className="avatar w-10 h-10 bg-gradient-instagram cursor-pointer"
            onClick={() => navigate(`/profile/${otherUser._id}`)}
          >
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.username} />
            ) : (
              <span className="font-semibold">
                {otherUser.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <h2 
              className="font-semibold cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${otherUser._id}`)}
            >
              {otherUser.username || 'Unknown User'}
            </h2>
            {otherUser.bio && (
              <p className="text-xs text-gray-400 truncate max-w-xs">{otherUser.bio}</p>
            )}
          </div>
        </div>
        <button className="hover:bg-dark-800 p-2 rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <MessageCircle size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation with {otherUser.username}!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              // ✅ Safe comparison with optional chaining
              const isOwn = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwn
                        ? 'bg-gradient-instagram text-white'
                        : 'bg-dark-800 text-white'
                    } rounded-2xl p-3`}
                  >
                    {msg.media && (
                      <div className="mb-2">
                        {msg.mediaType === 'image' ? (
                          <img
                            src={`http://localhost:5000${msg.media}`}
                            alt="Media"
                            className="rounded-lg max-w-full max-h-96 object-cover"
                          />
                        ) : (
                          <video
                            src={`http://localhost:5000${msg.media}`}
                            controls
                            className="rounded-lg max-w-full max-h-96"
                          />
                        )}
                      </div>
                    )}
                    {msg.content && <p className="break-words">{msg.content}</p>}
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-dark-800 p-4 bg-black">
        {selectedMedia && (
          <div className="mb-2 p-2 bg-dark-800 rounded-lg flex items-center justify-between">
            <span className="text-sm truncate">{selectedMedia.name}</span>
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="text-red-500 hover:text-red-400 ml-2 font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary p-3 hover:bg-dark-700 transition-colors"
          >
            <Image size={20} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser.username || 'user'}...`}
            className="input flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedMedia) || sending}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;