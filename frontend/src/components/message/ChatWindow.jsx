import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, ArrowLeft, Loader, MoreVertical, MessageCircle, X, Check, CheckCheck, Video, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http')) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const ChatWindow = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleReceiveMessage = (messageData) => {
      console.log('📨 Received message:', messageData);
      
      const msg = messageData.message;
      const isSender = msg.senderId?._id === userId || msg.senderId === userId;
      const isReceiver = msg.receiverId?._id === currentUser._id || msg.receiverId === currentUser._id;
      const isSentByMe = msg.senderId?._id === currentUser._id || msg.senderId === currentUser._id;
      const isSentToThem = msg.receiverId?._id === userId || msg.receiverId === userId;
      
      const belongsToThisChat = (isSender && isReceiver) || (isSentByMe && isSentToThem);
      
      if (belongsToThisChat) {
        console.log('✅ Adding message to this conversation');
        setMessages((prev) => {
          const exists = prev.some(m => m._id === msg._id);
          if (exists) {
            console.log('⚠️ Message already exists');
            return prev;
          }
          return [...prev, msg];
        });

        // ✅ If message is from other user, mark as read
        if (isSender && isReceiver) {
          console.log('📖 Marking message as read');
          socket.emit('mark-as-read', {
            messageIds: [msg._id],
            senderId: userId
          });
        }
      }
    };

    const handleUserTyping = (typingUserId) => {
      console.log('⌨️ User typing:', typingUserId);
      if (typingUserId === userId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (typingUserId) => {
      if (typingUserId === userId) {
        setIsTyping(false);
      }
    };

    // ✅ ADD: Handle messages read event
    const handleMessagesRead = ({ messageIds }) => {
      console.log('✅ Messages read by recipient:', messageIds);
      
      // Update messages to show as read (double check)
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
        )
      );
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('messages-read', handleMessagesRead); // ✅ ADD

    return () => {
      console.log('🧹 Cleaning up message listeners');
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('messages-read', handleMessagesRead); // ✅ ADD
    };
  }, [socket, userId, currentUser?._id]);

  useEffect(() => {
    if (userId && currentUser) {
      fetchUserInfo();
      fetchMessages();
    }
  }, [userId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ ADD: Mark all unread messages as read when opening chat
  useEffect(() => {
    if (!socket || !messages.length || !currentUser) return;

    // Find unread messages from other user
    const unreadMessages = messages.filter(
      (msg) =>
        !msg.isRead &&
        (msg.senderId?._id === userId || msg.senderId === userId) &&
        (msg.receiverId?._id === currentUser._id || msg.receiverId === currentUser._id)
    );

    if (unreadMessages.length > 0) {
      console.log('📖 Marking unread messages as read:', unreadMessages.length);
      socket.emit('mark-as-read', {
        messageIds: unreadMessages.map((m) => m._id),
        senderId: userId
      });

      // ✅ Update local state immediately
      setMessages((prev) =>
        prev.map((msg) =>
          unreadMessages.some((um) => um._id === msg._id)
            ? { ...msg, isRead: true }
            : msg
        )
      );
    } 
  }, [messages, socket, userId, currentUser?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserInfo = async () => {
    try {
      setLoadingUser(true);
      const { data } = await api.get(`/users/${userId}`);
      const userData = data.data?.user || data.data;
      setOtherUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user info');
      setOtherUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 404 || error.response?.data?.data?.length === 0) {
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
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: userId,
          message: data.data
        });
        socket.emit('stop-typing', { userId: currentUser._id, receiverId: userId });
      }

      setNewMessage('');
      setSelectedMedia(null);
      setMediaPreview(null);
      setMediaType(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    socket.emit('typing', { userId: currentUser._id, receiverId: userId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { userId: currentUser._id, receiverId: userId });
    }, 1000);
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error('Please select an image or video file');
        return;
      }

      setSelectedMedia(file);
      setMediaType(isImage ? 'image' : 'video');

      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaType(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageTime = (date) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) {
      return format(msgDate, 'HH:mm');
    } else if (isYesterday(msgDate)) {
      return `Yesterday ${format(msgDate, 'HH:mm')}`;
    } else {
      return format(msgDate, 'MMM dd, HH:mm');
    }
  };

  // ✅ Loading states now use full height of ChatWindow container
  if (!currentUser || loadingUser) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 flex flex-col justify-center items-center bg-dark-950">
          <Loader className="animate-spin mb-4 text-primary-500" size={32} />
          <p className="text-gray-400">{!currentUser ? 'Loading...' : 'Loading conversation...'}</p>
        </div>
      </div>
    );
  }

  if (!loadingUser && !otherUser) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 flex flex-col justify-center items-center bg-dark-950">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-4">
            <MessageCircle size={32} className="text-gray-600" />
          </div>
          <p className="text-gray-400 mb-4">User not found</p>
          <button onClick={() => navigate('/messages')} className="btn btn-primary">
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const isUserOnline = onlineUsers.has(userId);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b border-dark-800 px-6 py-4 flex items-center justify-between bg-dark-900 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/messages')}
            className="lg:hidden hover:bg-dark-800 p-2 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-dark-800 p-2 rounded-xl transition-colors -ml-2"
            onClick={() => navigate(`/profile/${otherUser._id}`)}
          >
            <div className="relative flex-shrink-0">
              <div className="avatar w-11 h-11 bg-dark-800">
                {otherUser.avatar ? (
                  <img 
                    src={getMediaUrl(otherUser.avatar)} 
                    alt={otherUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {otherUser.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              {isUserOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate text-base">
                {otherUser.username || 'Unknown User'}
              </h2>
              {/* ✅ REMOVE typing text from status - only show online/offline */}
              {isUserOnline ? (
                <p className="text-xs text-green-500">Active now</p>
              ) : (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </div>
          </div>
        </div>
        
        <button className="hover:bg-dark-800 p-2 rounded-full transition-colors flex-shrink-0">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent bg-dark-950">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center">
              <Loader className="animate-spin text-primary-500 mb-3" size={32} />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-4">
              <Send size={36} className="text-gray-600" />
            </div>
            <p className="text-xl font-medium text-gray-300 mb-2">No messages yet</p>
            <p className="text-sm text-gray-500">
              Start the conversation with {otherUser.username}!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id;
              const showTime = index === 0 || 
                (new Date(msg.createdAt) - new Date(messages[index - 1].createdAt)) > 60000;
              
              return (
                <div key={msg._id}>
                  {showTime && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 bg-dark-800 px-3 py-1.5 rounded-full">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {msg.media && (
                        <div className="mb-1">
                          {msg.mediaType === 'image' ? (
                            <img
                              src={getMediaUrl(msg.media)}
                              alt="Media"
                              className="rounded-2xl max-w-full max-h-[500px] object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                              onClick={() => window.open(getMediaUrl(msg.media), '_blank')}
                            />
                          ) : (
                            <div className="relative rounded-2xl overflow-hidden shadow-lg">
                              <video
                                src={getMediaUrl(msg.media)}
                                controls
                                className="rounded-2xl max-w-full max-h-[500px] bg-black"
                                preload="metadata"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {msg.content && (
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isOwn
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-800 text-gray-100'
                          } ${msg.media ? 'mt-1' : ''} shadow-sm`}
                        >
                          <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                      <div className={`flex items-center gap-1.5 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs text-gray-500">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                        {isOwn && (
                          msg.isRead ? (
                            <CheckCheck size={15} className="text-primary-400" />
                          ) : (
                            <Check size={15} className="text-gray-500" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ✅ ADD: Typing indicator bubble */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-dark-800 px-4 py-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot animation-delay-200"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-dark-800 px-6 py-4 bg-dark-900 flex-shrink-0">
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            {mediaType === 'image' ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="h-32 w-auto max-w-full object-cover rounded-2xl shadow-lg"
              />
            ) : (
              <div className="relative h-32 w-auto rounded-2xl overflow-hidden shadow-lg bg-black">
                <video
                  src={mediaPreview}
                  className="h-full w-auto object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Video size={14} />
                      Video ready
                    </span>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg z-10"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex gap-3 items-end">
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
            disabled={sending}
            className="p-3 hover:bg-dark-800 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50"
            title="Attach image or video"
          >
            <ImageIcon size={22} />
          </button>
          
          <div className="flex-1 bg-dark-800 rounded-2xl flex items-center px-5 py-3 border border-dark-700 focus-within:border-primary-500 transition-colors">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder={`Message ${otherUser.username || 'user'}...`}
              disabled={sending}
              className="flex-1 bg-transparent border-none outline-none text-sm disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedMedia) || sending}
            className="p-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:cursor-not-allowed rounded-xl transition-all disabled:opacity-50 flex-shrink-0 shadow-lg"
          >
            {sending ? (
              <Loader className="animate-spin" size={22} />
            ) : (
              <Send size={22} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;