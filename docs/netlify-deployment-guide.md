# FinTrack Pro - Netlify Deployment Guide

This guide will walk you through deploying the FinTrack Pro MERN stack application on Netlify (frontend) and Render (backend).

---

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- Render account (free tier works)
- MongoDB Atlas account (free tier works)

---

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/FinTrack-Pro.git
git push -u origin main
```

### 1.2 Repository Structure

Ensure your repository has this structure:
```
FinTrack-Pro/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── docs/
```

---

## Step 2: Deploy Backend on Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure settings:

| Setting | Value |
|---------|-------|
| Name | `fintrack-pro-api` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` or `node server.js` |
| Plan | Free |

### 2.2 Environment Variables

Add these environment variables in Render Dashboard:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fintrackpro?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

> **Note:** Replace with your actual credentials from `.env` file.

### 2.3 Update CORS Settings

In `backend/server.js`, update CORS to allow your Netlify domain:

```javascript
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://your-app-name.netlify.app'  // Add your Netlify URL
    ],
    credentials: true
};
```

---

## Step 3: Deploy Frontend on Netlify

### 3.1 Build Configuration

Create `netlify.toml` in the root directory:

```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3.2 Update API Base URL

In `frontend/src/services/api.js`, update the base URL:

```javascript
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

### 3.3 Create Environment Variables File

Create `frontend/.env.production`:

```
VITE_API_URL=https://fintrack-pro-api.onrender.com/api
```

### 3.4 Deploy on Netlify

**Option A: Via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
cd frontend
netlify init
netlify deploy --prod
```

**Option B: Via GitHub Integration (Recommended)**

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select GitHub and authorize Netlify
4. Select your `FinTrack-Pro` repository
5. Configure build settings:

| Setting | Value |
|---------|-------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist` |

6. Click **"Deploy site"**

### 3.5 Environment Variables on Netlify

1. Go to **Site settings** → **Environment variables**
2. Add:
   - `VITE_API_URL` = `https://fintrack-pro-api.onrender.com/api`

---

## Step 4: MongoDB Atlas Configuration

### 4.1 Whitelist IPs

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (allow all) or specific Render IPs

### 4.2 Verify Connection String

Ensure your `MONGO_URI` uses the correct format:
```
mongodb+srv://username:password@cluster.mongodb.net/fintrackpro?retryWrites=true&w=majority
```

---

## Step 5: Post-Deployment Verification

### 5.1 Test Backend API

```bash
curl https://fintrack-pro-api.onrender.com/api/health
```

### 5.2 Test Frontend

1. Visit your Netlify URL: `https://your-app-name.netlify.app`
2. Register a new user
3. Add a test investment
4. Verify data persists after refresh

### 5.3 Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Update backend CORS origin with Netlify URL |
| API 404 errors | Check `VITE_API_URL` environment variable |
| MongoDB connection failed | Whitelist `0.0.0.0/0` in Atlas |
| Build fails | Check `dist` folder exists in frontend |

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain on Netlify

1. Go to **Domain settings** → **Add custom domain**
2. Enter your domain (e.g., `fintrackpro.com`)
3. Follow DNS configuration steps

### 6.2 Update Backend CORS

Add your custom domain to CORS:

```javascript
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://your-app-name.netlify.app',
        'https://fintrackpro.com'  // Your custom domain
    ],
    credentials: true
};
```

---

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render
- [ ] Environment variables set on Render
- [ ] Frontend deployed on Netlify
- [ ] Environment variables set on Netlify
- [ ] MongoDB Atlas IP whitelist updated
- [ ] CORS origins updated in backend
- [ ] API base URL updated in frontend
- [ ] User registration tested
- [ ] Investment creation tested
- [ ] Data persistence verified

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend | `https://your-app-name.netlify.app` |
| Backend API | `https://fintrack-pro-api.onrender.com` |
| MongoDB | MongoDB Atlas Cloud |

---

## Support

For issues:
- Check Render logs: Dashboard → Logs
- Check Netlify deploy logs: Deploys → Deploy log
- Verify MongoDB Atlas: Clusters → Collections
