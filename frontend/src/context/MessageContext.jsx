import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';

const MessageContext = createContext();

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within MessageProvider');
    }
    return context;
};

export const MessageProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user, token } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadPerConversation, setUnreadPerConversation] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch unread message count per conversation
    const fetchUnreadPerConversation = useCallback(async () => {
        // Jangan fetch jika belum login
        if (!token || !user) {
            setUnreadPerConversation({});
            setUnreadCount(0);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/messages/unread/per-conversation');
            
            console.log('📨 Fetched unread per conversation:', response.data);
            
            // Build object dengan userId sebagai key
            const unreadMap = {};
            let totalUnread = 0;
            
            const dataArray = response.data.data || [];
            dataArray.forEach(item => {
                unreadMap[item.userId.toString()] = item.unreadCount;
                totalUnread += item.unreadCount;
            });
            
            setUnreadPerConversation(unreadMap);
            setUnreadCount(totalUnread);
            console.log('✅ Unread count updated:', totalUnread);
        } catch (err) {
            // Ignore 401 errors (not authenticated)
            if (err.status !== 401) {
                console.error('❌ Error fetching unread per conversation:', err);
                setError(err.error || 'Failed to fetch unread count');
            }
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    // Initial load hanya saat user login
    useEffect(() => {
        if (!token || !user) {
            // Reset state jika logout
            setUnreadPerConversation({});
            setUnreadCount(0);
            return;
        }

        console.log('📨 MessageContext - Initializing for user:', user._id);

        // Fetch unread count pertama kali
        fetchUnreadPerConversation();

        // Polling unread count setiap 20 detik
        const interval = setInterval(fetchUnreadPerConversation, 20000);

        return () => clearInterval(interval);
    }, [token, user, fetchUnreadPerConversation]);

    // Listen untuk real-time message updates dari Socket.IO
    useEffect(() => {
        if (!socket || !user) return;

        // Ketika ada pesan baru
        const handleReceiveMessage = (data) => {
            console.log('💬 New message received:', data);
            const { message } = data;
            
            // Tambah 1 ke unread count jika pesan dari user lain
            if (message.senderId !== user._id) {
                setUnreadCount((prev) => prev + 1);
                setUnreadPerConversation((prev) => ({
                    ...prev,
                    [message.senderId]: (prev[message.senderId] || 0) + 1
                }));
            }
        };

        // Ketika user membaca pesan
        const handleMessageRead = (data) => {
            console.log('✓ Messages marked as read:', data);
            fetchUnreadPerConversation();
        };

        socket.on('receive-message', handleReceiveMessage);
        socket.on('message-read', handleMessageRead);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('message-read', handleMessageRead);
        };
    }, [socket, user, fetchUnreadPerConversation]);

    const value = {
        unreadCount,
        unreadPerConversation,
        loading,
        error,
        fetchUnreadPerConversation,
        setUnreadCount,
        setUnreadPerConversation
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};
