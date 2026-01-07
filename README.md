# Social Media App (MERN Stack)

This repository contains the source code for a full-stack social media application built with a modern MERN-based stack (MongoDB, Express, React, Node.js) and includes real-time capabilities with Socket.IO.

## 🌟 Overview

This project is a complete social media platform that allows users to register, create profiles, share posts with images, follow other users, and interact with content through likes and comments. It also features a real-time chat system, live notifications, and expiring stories.

The codebase is organized into two main parts:
-   **`backend-api/`**: A Node.js and Express.js server that provides a RESTful API for all application data, manages user authentication, and handles WebSocket connections for real-time communication.
-   **`frontend/`**: A modern React single-page application (SPA) built with Vite and styled with Tailwind CSS. It provides a rich, interactive, and responsive user interface.

## ✨ Core Features

-   **Full User Authentication** (Register, Login, JWT-based sessions)
-   **Profile Management** (Avatars, bios, user pages)
-   **Post Creation and Interaction** (Text, images, likes, comments)
-   **Social Graph** (Followers & Following)
-   **Personalized Feed** & **Explore Page**
-   **Real-Time Chat** (with online status and typing indicators)
-   **Live Notifications** (for likes, comments, follows)
-   **Expiring Stories**

## 🚀 Getting Started

To get the full application running locally, you need to start both the backend server and the frontend client.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or newer recommended)
-   [MongoDB](https://www.mongodb.com/) (a local instance or a MongoDB Atlas cluster)
-   `npm` (Node Package Manager)

### 2. Backend Setup

First, navigate to the backend directory and follow its setup instructions. This will start the API server.

```bash
cd Social-Media-app/backend-api
```
**➡️ For detailed instructions, see the [Backend README](./Social-Media-app/backend-api/README.md).**

### 3. Frontend Setup

Once the backend is running, open a **new terminal window**, navigate to the frontend directory, and follow its setup instructions.

```bash
cd Social-Media-app/frontend
```
**➡️ For detailed instructions, see the [Frontend README](./Social-Media-app/frontend/README.md).**

### 4. You're All Set!

Once both are running:
-   The **Backend API** will be available at `http://localhost:5000` (by default).
-   The **Frontend Application** will be available at `http://localhost:5173` (by default).

Open `http://localhost:5173` in your browser to use the application.

## 🛠 Tech Stack

| Category                 | Technology                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Backend**              | Node.js, Express.js, MongoDB (with Mongoose), Socket.IO, JWT, Azure Blob Storage (optional)              |
| **Frontend**             | React, Vite, Tailwind CSS, React Router, Zustand, React Query, Socket.IO Client, Axios, React Hook Form |
| **Development**          | Nodemon (for backend), Vite HMR (for frontend), ESLint                                                 |

---

This project serves as a comprehensive example of a full-stack MERN application with modern tooling and features. For more specific details on either the frontend or backend, please refer to their respective README files.
