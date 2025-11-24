const express = require('express');
const http = require('http'); // ✅ ADD
const socketIo = require('socket.io'); // ✅ ADD
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { BlobServiceClient } = require('@azure/storage-blob');

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
const server = http.createServer(app); // ✅ CREATE HTTP SERVER

// ✅ SETUP SOCKET.IO
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
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

// ✅ SOCKET.IO CONNECTION HANDLING
const onlineUsers = new Map(); // Store userId -> socketId mapping

io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log('👤 User joined:', userId, '| Socket:', socket.id);
        console.log('📊 Online users:', onlineUsers.size);
        
        // Broadcast online status to all clients
        io.emit('user-online', userId);
    });

    // Handle new message
    socket.on('send-message', (messageData) => {
        console.log('📤 Socket message event:', messageData);
        
        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(messageData.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive-message', messageData);
            console.log('✅ Message delivered to:', messageData.receiverId);
        } else {
            console.log('⚠️ Receiver offline:', messageData.receiverId);
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ userId, receiverId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-typing', userId);
        }
    });

    socket.on('stop-typing', ({ userId, receiverId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-stop-typing', userId);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        // Find and remove user from onlineUsers
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user-offline', userId);
                console.log('👋 User disconnected:', userId);
                console.log('📊 Online users:', onlineUsers.size);
                break;
            }
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
});

// ✅ Make io accessible in routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));

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

// ✅ USE SERVER INSTEAD OF APP
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Uploads folder: ${path.join(__dirname, 'uploads')}`);
    console.log(`🔌 Socket.IO ready for connections`); // ✅ ADD
});
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
})();