# 🚀 Social Media API - Backend

RESTful API untuk aplikasi social media menggunakan Node.js, Express, dan MongoDB.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)

---

## ✨ Fitur

### Authentication
- ✅ Register dengan email & password
- ✅ Login dengan JWT token
- ✅ Protected routes dengan middleware auth

### User Management
- ✅ Get current user profile
- ✅ Get user profile by ID
- ✅ Update profile (username, bio, avatar)
- ✅ Search users by username/email
- ✅ Follow/Unfollow users

### Posts
- ✅ Create post (text + optional image)
- ✅ Get all posts (explore)
- ✅ Get feed (posts from followed users)
- ✅ Get post by ID
- ✅ Update post
- ✅ Delete post
- ✅ Like/Unlike post
- ✅ Save/Unsave post

### Comments
- ✅ Add comment to post
- ✅ Get comments for post
- ✅ Update comment
- ✅ Delete comment

### Interactions
- ✅ Real-time like count
- ✅ Real-time comment count
- ✅ Saved posts collection

---

## 🛠 Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB (NoSQL)
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **File Upload:** Multer
- **CORS:** cors
- **Environment:** dotenv

---

## 📦 Prerequisites

Pastikan sudah terinstall:

- [Node.js](https://nodejs.org/) v18 atau lebih tinggi
- [MongoDB](https://www.mongodb.com/) (Local atau Atlas)
- npm atau yarn

---

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend-api
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

Edit `.env` dengan konfigurasi Anda (lihat bagian Environment Variables).

### 4. Buat Folder Uploads

```bash
mkdir uploads
```

---

## 🔐 Environment Variables

Buat file `.env` dengan isi:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/sosmed-nosql
# Atau gunakan MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sosmed-nosql

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### ⚠️ Security Notes:
- Ganti `JWT_SECRET` dengan random string yang kuat
- Jangan commit file `.env` ke Git
- Gunakan environment variables yang berbeda untuk production

---

## 🚀 Menjalankan Aplikasi

### Development Mode (dengan auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server akan berjalan di: `http://localhost:5000`

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "",
    "bio": ""
  }
}
```

---

### User Endpoints

**🔒 All user endpoints require authentication header:**
```
Authorization: Bearer <token>
```

#### Get Current User
```http
GET /users/me
```

#### Get User Profile
```http
GET /users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "bio": "Hello world",
      "postsCount": 10,
      "followersCount": 25,
      "followingCount": 30,
      "isFollowing": false
    },
    "posts": [...]
  }
}
```

#### Update Profile
```http
PUT /users/profile
Content-Type: application/json

{
  "username": "newusername",
  "bio": "My new bio",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Search Users
```http
GET /users/search?q=john
```

#### Follow/Unfollow User
```http
POST /users/:id/follow
```

**Response:**
```json
{
  "success": true,
  "message": "Berhasil follow user",
  "isFollowing": true
}
```

#### Get Saved Posts
```http
GET /users/saved
```

---

### Post Endpoints

#### Create Post
```http
POST /posts
Content-Type: application/json

{
  "content": "Hello world! This is my first post.",
  "image": "https://example.com/image.jpg" // optional
}
```

#### Get All Posts (Explore)
```http
GET /posts
```

#### Get Feed (Following)
```http
GET /posts/feed?page=1&limit=20
```

#### Get Post by ID
```http
GET /posts/:id
```

#### Update Post
```http
PUT /posts/:id
Content-Type: application/json

{
  "content": "Updated content"
}
```

#### Delete Post
```http
DELETE /posts/:id
```

#### Like/Unlike Post
```http
POST /posts/:id/like
```

**Response:**
```json
{
  "success": true,
  "message": "Post liked",
  "isLiked": true,
  "likesCount": 5
}
```

#### Save/Unsave Post
```http
POST /posts/:id/save
```

---

### Comment Endpoints

#### Add Comment
```http
POST /comments/post/:postId
Content-Type: application/json

{
  "content": "Great post!"
}
```

#### Get Comments
```http
GET /comments/post/:postId
```

#### Update Comment
```http
PUT /comments/:id
Content-Type: application/json

{
  "content": "Updated comment"
}
```

#### Delete Comment
```http
DELETE /comments/:id
```

---

## 🗄 Database Schema

### User
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  password: String (hashed, min 6 chars),
  bio: String (max 150 chars),
  avatar: String (URL),
  createdAt: Date
}
```

### Post
```javascript
{
  userId: ObjectId (ref: User),
  content: String (required, max 500 chars),
  image: String (URL, optional),
  createdAt: Date
}
```

### Comment
```javascript
{
  postId: ObjectId (ref: Post),
  userId: ObjectId (ref: User),
  content: String (required, max 500 chars),
  createdAt: Date
}
```

### Like
```javascript
{
  postId: ObjectId (ref: Post),
  userId: ObjectId (ref: User),
  createdAt: Date
}
```

### SavedPost
```javascript
{
  postId: ObjectId (ref: Post),
  userId: ObjectId (ref: User),
  createdAt: Date
}
```

### Follower
```javascript
{
  followerId: ObjectId (ref: User),
  followingId: ObjectId (ref: User),
  createdAt: Date
}
```

---

## 🧪 Testing

### Run API Tests

```bash
node test-api.js
```

### Test Output:
```
════════════════════════════════════════════════════════════
  📝 AUTHENTICATION TESTS
════════════════════════════════════════════════════════════

▶ Test 1: Register User 1
✅ User 1 registered: user1_1763383534171

▶ Test 2: Register User 2
✅ User 2 registered: user2_1763383534671

...

════════════════════════════════════════════════════════════
  TEST RESULTS
════════════════════════════════════════════════════════════

  ✅ Tests Passed: 24
  ❌ Tests Failed: 0
  📊 Total Tests: 24
  📈 Pass Rate: 100.0%

  🎉 ALL TESTS PASSED! 🎉
```

---

## 📁 Project Structure

```
backend-api/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   ├── userController.js  # User logic
│   │   ├── postController.js  # Post logic
│   │   └── commentController.js # Comment logic
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Like.js
│   │   ├── SavedPost.js
│   │   └── Follower.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   └── commentRoutes.js
│   └── middleware/
│       ├── auth.js            # JWT verification
│       └── logger.js          # Request logger
├── uploads/                    # Uploaded files
├── .env                        # Environment variables
├── .env.example               # Example env file
├── server.js                  # Entry point
├── test-api.js                # API tests
├── package.json
└── README.md
```

---

## 🐛 Common Issues

### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Pastikan MongoDB sedang berjalan:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 2. JWT Token Invalid
```
Error: jwt malformed
```
**Solution:** 
- Pastikan menyertakan Bearer token di header
- Format: `Authorization: Bearer <token>`

### 3. CORS Error
```
Access to fetch blocked by CORS policy
```
**Solution:** 
- Periksa `CORS_ORIGIN` di `.env`
- Pastikan sesuai dengan URL frontend

---

## 📝 License

MIT License

---

## 👨‍💻 Developer

Developed with ❤️ by [Your Name]

---

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📧 Support

For support, email [your-email@example.com]