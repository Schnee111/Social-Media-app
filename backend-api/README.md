# 🚀 Social Media API - Backend

This is the backend for a full-featured social media application, providing a RESTful API and real-time communication using WebSockets. It's built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Real-time Functionality](#-real-time-functionality)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## ✨ Features

### Core
- ✅ **Authentication:** Secure user registration and login using JWT.
- ✅ **User Management:** User profiles, follow/unfollow, search, and profile updates.
- ✅ **Post Management:** Create, read, update, delete posts (with images).
- ✅ **Social Interaction:** Like/unlike, comment on posts, and save posts.
- ✅ **Personalized Feeds:** Get a feed of posts from followed users.
- ✅ **Story Feature:** Create and view stories that expire after a certain time.

### Real-time
- ✅ **Live Notifications:** Receive real-time notifications for likes, comments, and follows.
- ✅ **Real-time Chat:** One-on-one messaging with online status, typing indicators, and read receipts.
- ✅ **Analytics:** Basic analytics endpoints.

---

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Real-time Communication:** Socket.IO
- **Authentication:** JSON Web Tokens (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **File Uploads:** Multer
- **Cloud Storage:** Microsoft Azure Blob Storage (Optional)
- **Middleware:** CORS, Helmet, Morgan (for logging)

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (either a local instance or a cloud-hosted one like MongoDB Atlas)
- `npm` or another package manager.

---

## 🔧 Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Social-Media-app/backend-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the `backend-api` directory by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Then, edit the `.env` file with your specific configuration. See the [Environment Variables](#-environment-variables) section below for details.

---

## 🔐 Environment Variables

Your `.env` file should contain the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection String
# Example for local MongoDB: mongodb://localhost:27017/social-media
# Example for Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/yourDatabaseName
MONGO_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_and_long_jwt_key
JWT_EXPIRE=30d

# Frontend URL for CORS
# This must match the URL where your frontend is running
CORS_ORIGIN=http://localhost:5173

# --- Optional Azure Blob Storage ---
# If you want to use Azure for file storage, provide these variables.
# Otherwise, the server will use the local 'uploads/' directory.
# AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
# AZURE_STORAGE_CONTAINER_NAME=your_azure_container_name
```
**⚠️ Important:** Never commit your `.env` file to version control.

---

## 🚀 Running the Application

-   **Development Mode:**
    For development with automatic server reloading on file changes (uses `nodemon`):
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    For a standard production start:
    ```bash
    npm start
    ```

The server will start on the port defined in your `.env` file (default is `5000`).

---

## 📡 API Endpoints

The API is structured modularly. The base URL is `/api`.

-   `GET /`: Returns basic API information.
-   `POST /api/auth/register`: Register a new user.
-   `POST /api/auth/login`: Log in a user.
-   `GET /api/users/me`: Get the current logged-in user's profile.
-   `GET /api/users/:id`: Get a specific user's profile.
-   `PUT /api/users/profile`: Update the logged-in user's profile.
-   `POST /api/users/:id/follow`: Follow or unfollow a user.
-   `GET /api/posts`: Get posts for the "explore" page.
-   `GET /api/posts/feed`: Get the feed of posts from users you follow.
-   `POST /api/posts`: Create a new post.
-   `GET /api/posts/:id`: Get a single post by its ID.
-   `DELETE /api/posts/:id`: Delete a post.
-   `POST /api/posts/:id/like`: Like or unlike a post.
-   `POST /api/comments/post/:postId`: Add a comment to a post.
-   `GET /api/comments/post/:postId`: Get all comments for a post.
-
-   `/api/analytics`: Endpoints for application analytics.
-   `/api/messages`: Endpoints for fetching and sending chat messages.
-   `/api/stories`: Endpoints for creating and viewing stories.
-   `/api/notifications`: Endpoints for managing notifications.

---

##  WebSocket Real-time Functionality

The server uses Socket.IO for real-time features.

-   **Connection:** A client connects and joins with a `userId`.
-   **Events Emitted by Server:**
    -   `receive-message`: A new chat message is sent to the recipient.
    -   `receive-notification`: A new notification (like, comment, follow) is sent to the recipient.
    -   `user-online`, `user-offline`: Broadcasts when a user's connection status changes.
    -   `online-users`: Sent to a newly connected client, listing all currently online users.
-   **Events Listened for by Server:**
    -   `join`: A user identifies themselves to the server.
    -   `send-message`: A client sends a chat message to another user.
    -   `send-notification`: A client action triggers a notification to another user.
    -   `typing`, `stop-typing`: For chat typing indicators.
    -   `mark-as-read`: To update the status of chat messages.

---

## 📁 Project Structure

```
backend-api/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection logic
│   ├── controllers/           # Handles request logic for each route
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── messageController.js
│   │   ├── storyController.js
│   │   ├── notificationController.js
│   │   └── analyticsController.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT token verification
│   │   ├── errorHandler.js    # Central error handler
│   │   ├── logger.js          # Request logger
│   │   └── upload.js          # Multer configuration for file uploads
│   ├── models/                # Mongoose schemas for MongoDB
│   │   ├── User.js, Post.js, Comment.js, etc.
│   └── routes/                # Defines the API endpoints
│       ├── authRoutes.js, userRoutes.js, etc.
├── uploads/                   # Directory for locally stored file uploads
├── .env                       # Environment variables (private)
├── .env.example               # Example environment variables
├── server.js                  # Main application entry point
└── package.json               # Project dependencies and scripts
```

---

## 📝 License

This project is licensed under the MIT License.
