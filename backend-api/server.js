const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // ✅ ADD THIS
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger middleware
const logger = require('./src/middleware/logger');
app.use(logger);

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
            uploads: '/uploads' // ✅ ADD THIS
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Uploads folder: ${path.join(__dirname, 'uploads')}`); // ✅ ADD THIS
});