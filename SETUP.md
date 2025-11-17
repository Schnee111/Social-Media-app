# 🚀 Setup Instructions

Quick guide untuk setup project di local atau production.

## 📦 Prerequisites

- Node.js v18+
- MongoDB (local atau Atlas)
- Git

---

## 🔧 Backend Setup

### 1. Navigate to backend directory
```bash
cd backend-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```

### 4. Edit .env file
```bash
# Windows
notepad .env

# Mac/Linux
nano .env
# or
vim .env
```

**Required changes:**
- Set `MONGO_URI` to your MongoDB connection string
- Generate and set `JWT_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Set `CORS_ORIGIN` to your frontend URL

### 5. Create uploads folder
```bash
mkdir uploads
```

### 6. Run backend
```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

---

## 🎨 Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```

### 4. Edit .env file
```bash
# Windows
notepad .env

# Mac/Linux
nano .env
```

**Required changes:**
- Set `VITE_API_URL` to your backend URL (default: `http://localhost:5000/api`)

### 5. Run frontend
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🧪 Test the Application

1. Open browser: `http://localhost:5173`
2. Register a new account
3. Login
4. Create a post
5. Test features

---

## 🚀 Production Deployment

### Backend (Example: Heroku)

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

### Frontend (Example: Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend-url.com/api
```

---

## 📝 Environment Variables Summary

### Backend Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT (min 32 chars)
- `CORS_ORIGIN` - Frontend URL

### Frontend Required
- `VITE_API_URL` - Backend API URL

---

## ⚠️ Security Checklist

- [ ] Change default `JWT_SECRET`
- [ ] Use strong `MONGO_URI` password
- [ ] Enable MongoDB authentication
- [ ] Set proper `CORS_ORIGIN`
- [ ] Use HTTPS in production
- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting (optional)
- [ ] Implement input validation
- [ ] Sanitize user inputs

---

## 🐛 Troubleshooting

### Backend won't start
1. Check MongoDB is running
2. Verify `.env` file exists
3. Check port 5000 is not in use

### Frontend can't connect to API
1. Verify backend is running
2. Check `VITE_API_URL` in `.env`
3. Check CORS settings in backend

### MongoDB connection error
1. Verify `MONGO_URI` format
2. Check network/firewall settings
3. Ensure MongoDB is running

---

## 📧 Support

For issues, please create a GitHub issue or contact [your-email]