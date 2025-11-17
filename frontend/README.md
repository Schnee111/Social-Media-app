# 🎨 Social Media App - Frontend

Modern social media web application built with React, Vite, and TailwindCSS.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [UI Components](#ui-components)

---

## ✨ Fitur

### 🔐 Authentication
- ✅ Register & Login form dengan validasi
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Auto logout on token expiry
- ✅ Persistent login (localStorage)

### 👤 User Profile
- ✅ View own profile & other users
- ✅ Edit profile (username, bio, avatar)
- ✅ Follow/Unfollow users
- ✅ See follower & following counts
- ✅ View user's posts

### 📝 Posts
- ✅ Create post with text & image
- ✅ View all posts (explore)
- ✅ Personalized feed (following)
- ✅ Like/Unlike posts
- ✅ Save/Unsave posts
- ✅ Edit & delete own posts
- ✅ Real-time like/comment counts

### 💬 Comments
- ✅ Add comments to posts
- ✅ Edit & delete own comments
- ✅ View all comments
- ✅ Real-time comment updates

### 🔍 Search & Explore
- ✅ Search posts by content
- ✅ Search users by username
- ✅ Tab navigation (Posts/Users)
- ✅ Explore all public posts

### 📱 Responsive Design
- ✅ Mobile-first approach
- ✅ Tablet & desktop optimized
- ✅ Dark theme UI
- ✅ Smooth animations

---

## 🛠 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Date Formatting:** date-fns

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) v18 atau lebih tinggi
- npm atau yarn
- Backend API harus sudah running

---

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root folder:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda.

---

## 🔐 Environment Variables

Buat file `.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Social Media App
```

**Notes:**
- `VITE_API_URL` harus sesuai dengan backend API URL
- Semua env variables harus diawali dengan `VITE_`

---

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

App akan berjalan di: `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output di folder `dist/`

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, etc
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── comment/
│   │   │   ├── CommentSection.jsx
│   │   │   └── CommentItem.jsx
│   │   ├── post/
│   │   │   ├── PostCard.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   └── PostMenu.jsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.jsx
│   │   │   └── ProfileTabs.jsx
│   │   └── layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # Auth state management
│   ├── pages/
│   │   ├── HomePage.jsx       # Feed
│   │   ├── ExplorePage.jsx    # All posts + search
│   │   ├── ProfilePage.jsx    # User profile
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── services/
│   │   └── api.js             # Axios instance
│   ├── App.jsx               # Route definitions
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── .env                      # Environment variables
├── .env.example             # Example env file
├── tailwind.config.js       # TailwindCSS config
├── vite.config.js           # Vite config
├── package.json
└── README.md
```

---

## 📜 Available Scripts

### `npm run dev`
Menjalankan app di development mode dengan hot reload.

### `npm run build`
Build app untuk production ke folder `dist/`.

### `npm run preview`
Preview production build secara lokal.

### `npm run lint`
Run ESLint untuk check code quality.

---

## 🎨 UI Components

### Card Component
```jsx
<div className="card">
  <div className="card-body">
    Card content here
  </div>
</div>
```

### Button Component
```jsx
{/* Primary Button */}
<button className="btn btn-primary">Click me</button>

{/* Secondary Button */}
<button className="btn btn-secondary">Cancel</button>

{/* Ghost Button */}
<button className="btn btn-ghost">
  <Icon size={20} />
</button>
```

### Input Component
```jsx
<input 
  type="text" 
  placeholder="Enter text..." 
  className="input"
/>
```

### Avatar Component
```jsx
<div className="avatar w-12 h-12">
  <img src={user.avatar} alt={user.username} />
</div>

{/* With ring effect */}
<div className="avatar-ring">
  <div className="avatar w-32 h-32">
    <img src={user.avatar} alt={user.username} />
  </div>
</div>
```

---

## 🎨 Color Scheme

```css
/* Primary Colors */
--primary-500: #3b82f6;  /* Blue */
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Dark Theme */
--dark-900: #0f172a;     /* Background */
--dark-800: #1e293b;     /* Cards */
--dark-700: #334155;     /* Borders */

/* Text */
--gray-100: #f1f5f9;     /* Primary text */
--gray-400: #94a3b8;     /* Secondary text */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

---

## 🔒 Authentication Flow

### 1. Login/Register
```
User → LoginForm → AuthContext.login() → API → Save token → Redirect to Home
```

### 2. Protected Routes
```
Access Route → Check Auth → Redirect to Login (if not authenticated)
```

### 3. Auto Logout
```
API Error 401 → Clear token → Redirect to Login
```

### 4. Persistent Login
```
Page Load → Check localStorage → Load user & token → Set auth state
```

---

## 🚀 Key Features Implementation

### React Query for Data Fetching

```jsx
// Get feed
const { data, isLoading, refetch } = useQuery({
  queryKey: ['feed'],
  queryFn: async () => {
    const response = await api.get('/posts/feed');
    return response.data.data;
  },
});

// Mutation for creating post
const createPostMutation = useMutation({
  mutationFn: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  onSuccess: () => {
    refetch();
    toast.success('Post created!');
  },
});
```

### Protected Routes

```jsx
// App.jsx
<Route 
  path="/" 
  element={
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  } 
/>
```

### Toast Notifications

```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Post created successfully!');

// Error
toast.error('Failed to create post');

// Loading
toast.loading('Creating post...');
```

---

## 🐛 Troubleshooting

### 1. API Connection Error
```
Error: Network Error
```
**Solution:**
- Pastikan backend sedang berjalan
- Check `VITE_API_URL` di `.env`
- Check CORS settings di backend

### 2. Token Expired
```
Error: 401 Unauthorized
```
**Solution:**
- Login ulang
- Check JWT_EXPIRE di backend

### 3. Build Error
```
Error: Cannot find module
```
**Solution:**
```bash
rm -rf node_modules
npm install
```

---

## 📝 Best Practices

### 1. Component Organization
- Pisahkan UI components dari business logic
- Gunakan custom hooks untuk reusable logic
- Keep components small and focused

### 2. State Management
- Use React Query for server state
- Use Context API for global state (auth)
- Use local state for UI state

### 3. Performance
- Lazy load routes
- Optimize images
- Use React.memo untuk heavy components
- Implement pagination for large lists

---

## 🔮 Future Enhancements

- [ ] Real-time notifications (WebSocket)
- [ ] Image upload with preview
- [ ] Video posts
- [ ] Stories feature
- [ ] Direct messaging
- [ ] Push notifications
- [ ] PWA support
- [ ] Dark/Light theme toggle

---

## 📝 License

MIT License

---

## 👨‍💻 Developer

Developed with ❤️ by [Your Name]

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For support, email [your-email@example.com]
