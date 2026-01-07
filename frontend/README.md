# 🎨 Social Media App - Frontend

This is the frontend for a modern, full-featured social media web application built with React, Vite, and Tailwind CSS. It connects to a backend API to provide a seamless and interactive user experience.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- ✅ **Secure Authentication:** User registration and login with JWT-based persistent sessions.
- ✅ **Protected Routes:** Certain pages and actions are only accessible to authenticated users.
- ✅ **Profile Management:** View and edit user profiles, including username, bio, and avatar.
- ✅ **Social Graph:** Follow and unfollow other users.
- ✅ **Post Management:** Create, view, edit, and delete posts.
- ✅ **Interactive Feed:** A personalized feed showing posts from followed users, plus an "Explore" page for discovering new content.
- ✅ **Social Interactions:** Like, comment on, and save posts.
- ✅ **Stories:** Create and view temporary stories from followed users.

### Real-time & Interactive
- ✅ **Real-time Chat:** One-on-one instant messaging with online status, typing indicators, and read receipts powered by WebSockets.
- ✅ **Live Notifications:** Receive instant notifications for new likes, comments, and followers.
- ✅ **Responsive Design:** A clean, modern, and mobile-first user interface that works across all devices.
- ✅ **Modals:** Seamless modals for viewing post details, likes, followers, and editing profiles.

---

## 🛠 Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with `clsx` and `tailwind-merge` for efficient class management.
- **Routing:** React Router
- **State Management:** Zustand (for global state like auth) & React Query (for server state).
- **Data Fetching:** Axios & React Query (TanStack Query)
- **Forms:** React Hook Form with Zod for robust validation.
- **Real-time Communication:** Socket.IO Client
- **UI Components:** Headless UI for accessible, unstyled components.
- **Icons:** Lucide React
- **Notifications:** React Hot Toast for user feedback.
- **Date Handling:** `date-fns`

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm` or another package manager.
- A running instance of the [backend server](<path-to-your-backend-readme>).

---

## 🔧 Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Social-Media-app/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the `frontend` directory. You can copy the structure from your existing `.env` file if you have one.
    ```bash
    # Example command to create and pre-fill the file
    echo "VITE_API_URL=http://localhost:5000/api" > .env
    ```
    See the [Environment Variables](#-environment-variables) section below for details.

---

## 🔐 Environment Variables

The frontend requires the following environment variable in your `.env` file:

```env
# The full base URL for the backend API
VITE_API_URL=http://localhost:5000/api
```
**Note:** In Vite, only environment variables prefixed with `VITE_` are exposed to the browser. Ensure your backend's `CORS_ORIGIN` in its `.env` file matches the URL where this frontend is running (e.g., `http://localhost:5173` by default).

---

## 🚀 Available Scripts

-   `npm run dev`: Starts the development server with Hot Module Replacement (HMR) at `http://localhost:5173`.
-   `npm run build`: Compiles and bundles the application for production into the `dist/` directory.
-   `npm run lint`: Lints the code using ESLint to check for errors and style issues.
-   `npm run preview`: Serves the production build from the `dist/` directory for local testing.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets like images and SVGs
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Layout, ProtectedRoute, etc.
│   │   ├── comment/         # Comment-related components
│   │   ├── creation/        # Components for creating posts/stories
│   │   ├── message/         # Chat and conversation components
│   │   ├── notification/    # Notification UI elements
│   │   ├── post/            # Post cards, modals, etc.
│   │   ├── story/           # Story feed and items
│   │   └── user/            # User-related components
│   ├── context/             # React contexts (Auth, Socket, etc.)
│   ├── pages/               # Top-level page components for each route
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── ...
│   ├── services/            # API service configurations (e.g., Axios instance)
│   │   ├── api.js
│   │   └── notificationService.js
│   ├── utils/               # Helper functions
│   │   └── imageHelper.js
│   ├── App.jsx              # Main application component with routing setup
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global CSS styles
├── .env                     # Environment variables (private)
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite build configuration
└── package.json             # Project dependencies and scripts
```

---

## 📝 License

This project is licensed under the MIT License.