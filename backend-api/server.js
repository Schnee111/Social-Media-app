const express = require('express');
const http = require('http'); // ADD
const socketIo = require('socket.io'); // ADD
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { BlobServiceClient } = require('@azure/storage-blob');
const Notification = require('./src/models/Notification');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const checkAzureConnection = async () => {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING; //
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME; //

    if (!connectionString || !containerName) {
        console.warn('⚠️ AZURE CHECK: Connection string atau container name tidak ditemukan. Lanjut tanpa verifikasi Azure.');
        return;
    }

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Coba mendapatkan client untuk container
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Coba memanggil salah satu operasi yang memerlukan koneksi
        // Kita gunakan exists() untuk verifikasi ringan
        const containerExists = await containerClient.exists();

        if (containerExists) {
            console.log(`☁️ AZURE CHECK: Berhasil terkoneksi. Container "${containerName}" ditemukan.`);
        } else {
            console.error(`❌ AZURE CHECK: Koneksi berhasil, tetapi container "${containerName}" tidak ditemukan.`);
            // Anda dapat menambahkan logika untuk membuat container di sini jika diperlukan.
        }
    } catch (error) {
        console.error(`❌ AZURE CHECK: GAGAL koneksi ke Azure Blob Storage. Error: ${error.message}`);
    }
};

const app = express();
const server = http.createServer(app); // CREATE HTTP SERVER

// SETUP SOCKET.IO - Add transports & better config
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'], // ADD: Support both transports
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
const logger = require('./src/middleware/logger');
app.use(logger);

// SOCKET.IO CONNECTION HANDLING
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    console.log('🔧 Transport:', socket.conn.transport.name); // Log transport type

    // User joins with their userId
    socket.on('join', (userId) => {
        // Check for duplicate connections
        const existingSocketId = onlineUsers.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log('⚠️ User already connected, replacing old socket:', userId);
            const oldSocket = io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
                oldSocket.disconnect(true);
            }
        }

        onlineUsers.set(userId, socket.id);
        socket.userId = userId; // Store userId in socket
        
        console.log('👤 User joined:', userId, '| Socket:', socket.id);
        console.log('📊 Online users:', onlineUsers.size);
        console.log('📋 Online users list:', Array.from(onlineUsers.keys()));
        
        // Send current online users to joining user
        socket.emit('online-users', Array.from(onlineUsers.keys()));
        
        // Broadcast to ALL (including sender)
        io.emit('user-online', userId);
    });

    // Handle new message
    socket.on('send-message', (messageData) => {
        console.log('📤 Socket message event:', messageData);
        
        const receiverSocketId = onlineUsers.get(messageData.receiverId);
        if (receiverSocketId) {
            // Send to receiver
            io.to(receiverSocketId).emit('receive-message', messageData);
            console.log('Message delivered to:', messageData.receiverId);
            
            // Confirm to sender
            socket.emit('message-sent', { messageId: messageData.message._id });
        } else {
            console.log('⚠️ Receiver offline:', messageData.receiverId);
            socket.emit('receiver-offline', { receiverId: messageData.receiverId });
        }
    });

    //  Handle mark as read
    socket.on('mark-as-read', async ({ messageIds, senderId }) => {
        try {
            console.log('📖 Mark as read:', { messageIds, senderId });
            
            // Update messages in database
            await Message.updateMany(
            { _id: { $in: messageIds } },
            { isRead: true, readAt: new Date() }
            );
            
            // Notify sender that messages were read
            const senderSocketId = onlineUsers.get(senderId);
            if (senderSocketId) {
            io.to(senderSocketId).emit('messages-read', { messageIds });
            console.log('✅ Read receipt sent to sender:', senderId);
            }
        } catch (error) {
            console.error('❌ Error marking as read:', error);
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ userId, receiverId }) => {
        console.log('⌨️ Typing event:', userId, '→', receiverId);
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-typing', userId);
            console.log('Typing indicator sent');
        }
    });

    socket.on('stop-typing', ({ userId, receiverId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-stop-typing', userId);
        }
    });

    // Handle notification
    socket.on('send-notification', async (notificationData) => {
        try {
            console.log('📬 Notification event:', notificationData);
            
            const notification = new Notification({
                recipientId: notificationData.recipientId,
                senderId: notificationData.senderId,
                type: notificationData.type,
                content: notificationData.content,
                relatedId: notificationData.relatedId,
                relatedType: notificationData.relatedType
            });
            
            await notification.save();
            await notification.populate([
                { path: 'senderId', select: 'username avatar' },
                { path: 'relatedId', select: 'content image title' } 
            ]);

            const recipientSocketId = onlineUsers.get(notificationData.recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receive-notification', notification);
                console.log('Notification delivered to:', notificationData.recipientId);
            } else {
                console.log('⚠️ Recipient offline:', notificationData.recipientId);
            }
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            socket.emit('notification-error', { error: error.message });
        }
    });

    // Handle transport upgrade
    socket.conn.on('upgrade', (transport) => {
        console.log('🔄 Transport upgraded to:', transport.name);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log('👋 Client disconnecting:', socket.id, '| Reason:', reason);
        
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('user-offline', socket.userId);
            console.log('🔴 User offline:', socket.userId);
            console.log('📊 Online users:', onlineUsers.size);
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });
});

// Make io accessible in routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/stories', require('./src/routes/storyRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Social Media API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            posts: '/api/posts',
            comments: '/api/comments',
            analytics: '/api/analytics',
            messages: '/api/messages', 
            stories: '/api/stories',
            notifications: '/api/notifications'
        },
        socket: {
            connected: io.engine.clientsCount,
            onlineUsers: onlineUsers.size
        } 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

(async () => {
    await checkAzureConnection();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Uploads folder: ${path.join(__dirname, 'uploads')}`);
    console.log(`🔌 Socket.IO ready for connections`);
});
})();