import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ Cleanup previous socket
    if (socketRef.current) {
      console.log('🧹 Cleaning up existing socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (user?._id) {
      console.log('🔌 Initializing socket for user:', user._id);
      
      // ✅ Get API URL from env
      const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      console.log('🌐 Connecting to:', API_URL);
      
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'], // ✅ Match backend
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true, // ✅ Force new connection
      });

      // ✅ Connection handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        console.log('🆔 Socket ID:', newSocket.id);
        console.log('🔧 Transport:', newSocket.io.engine.transport.name);
        
        setIsConnected(true);
        
        // ✅ Join AFTER connection established
        console.log('📤 Emitting join event for user:', user._id);
        newSocket.emit('join', user._id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        setIsConnected(false);
      });

      // ✅ Transport upgrade handler
      newSocket.io.engine.on('upgrade', (transport) => {
        console.log('🔄 Transport upgraded to:', transport.name);
      });

      // ✅ Online users sync - Initial list
      newSocket.on('online-users', (users) => {
        console.log('👥 Received online users list:', users);
        setOnlineUsers(new Set(users));
      });

      // ✅ User online event
      newSocket.on('user-online', (userId) => {
        console.log('🟢 User came online:', userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          console.log('📊 Updated online users:', Array.from(newSet));
          return newSet;
        });
      });

      // ✅ User offline event
      newSocket.on('user-offline', (userId) => {
        console.log('🔴 User went offline:', userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          console.log('📊 Updated online users:', Array.from(newSet));
          return newSet;
        });
      });

      // Store in ref and state
      socketRef.current = newSocket;
      setSocket(newSocket);

      // ✅ Cleanup on unmount
      return () => {
        console.log('🧹 SocketProvider cleanup');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      };
    } else {
      // User logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
    }
  }, [user?._id]); // ✅ Only re-run when user._id changes

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};