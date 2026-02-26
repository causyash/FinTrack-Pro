# FinTrack Pro - Complete Project Setup Guide

This guide will help you set up and run the entire FinTrack Pro MERN stack application on your local machine.

## Prerequisites

Before starting, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **Razorpay account** - [Sign up here](https://razorpay.com) (for payments)
- **Code Editor** - VS Code recommended

## Quick Start (5 Minutes)

### Step 1: Clone and Navigate to Project

```bash
cd "d:\home practice\FinTrack Pro"
```

### Step 2: Set Up Environment Variables

#### Backend Environment

1. Navigate to backend folder:
```bash
cd backend
```

2. Create `.env` file:
```bash
copy .env.example .env
```

3. Edit `.env` file with your credentials:
```env
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/fintrack-pro?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Razorpay Test Keys (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment

1. Navigate to frontend folder:
```bash
cd ../frontend
```

2. Create `.env` file:
```bash
copy .env.example .env
```

3. Edit `.env` file:
```env
# API URL
VITE_API_URL=http://localhost:5000/api

# Razorpay Key ID (same as backend, but public key)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

### Step 3: Install Dependencies

#### Install Backend Dependencies

```bash
cd "d:\home practice\FinTrack Pro\backend"
npm install
```

#### Install Frontend Dependencies

```bash
cd "d:\home practice\FinTrack Pro\frontend"
npm install
```

### Step 4: Run Both Servers Simultaneously

#### Option A: Using Two Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd "d:\home practice\FinTrack Pro\backend"
npm run dev
```

You should see:
```
Server running in development mode on port 5000
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

**Terminal 2 - Frontend:**
```bash
cd "d:\home practice\FinTrack Pro\frontend"
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

#### Option B: Using Concurrently (Single Command)

1. Install `concurrently` globally:
```bash
npm install -g concurrently
```

2. Create a root `package.json` in the main project folder:

Create file `d:\home practice\FinTrack Pro\package.json`:

```json
{
  "name": "fintrack-pro",
  "version": "1.0.0",
  "description": "FinTrack Pro - Personal Finance SaaS",
  "scripts": {
    "install-all": "cd backend && npm install && cd ../frontend && npm install",
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
    "backend": "cd backend && npm run dev",
    "frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

3. Run both servers with one command:
```bash
cd "d:\home practice\FinTrack Pro"
npm run dev
```

This will start both backend and frontend simultaneously.

### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

---

## Detailed Setup Instructions

### 1. MongoDB Atlas Setup

Follow the detailed guide in `docs/mongodb-atlas-setup.md`:

1. Create free M0 cluster on MongoDB Atlas
2. Create database user with password
3. Whitelist your IP address (0.0.0.0/0 for development)
4. Get connection string
5. Add to `backend/.env`

### 2. Razorpay Setup (for Payments)

Follow the detailed guide in `docs/google-pay-integration.md`:

1. Create Razorpay account
2. Switch to Test Mode
3. Generate API Keys
4. Add keys to both `.env` files
5. Set up webhook (optional for local development)

### 3. Create Admin User

By default, all registered users have the "user" role. To create an admin:

1. Register a user through the frontend
2. Connect to MongoDB Atlas
3. Update the user's role:

```javascript
// In MongoDB Atlas or MongoDB Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Development Workflow

### Daily Development Commands

```bash
# Navigate to project
cd "d:\home practice\FinTrack Pro"

# Start both servers (if using concurrently)
npm run dev

# Or start individually:
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend
npm run frontend
```

### Making Changes

- **Backend changes**: Server auto-restarts with nodemon
- **Frontend changes**: Vite hot-reloads automatically
- **Environment changes**: Restart the respective server

### Testing the Application

1. **Register a new account** at http://localhost:5173/register
2. **Login** with your credentials
3. **Add transactions** in the Transactions page
4. **Create goals** in the Goals page
5. **Add investments** in the Investments page
6. **View dashboard** for analytics

---

## Common Issues & Solutions

### Issue 1: "Cannot find module"

**Solution**: Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Issue 2: "MongoDB connection failed"

**Solution**: 
1. Check your `MONGO_URI` in `backend/.env`
2. Ensure IP is whitelisted in MongoDB Atlas
3. Check internet connection

### Issue 3: "Port already in use"

**Solution**: 
- Backend: Change `PORT` in `.env` (e.g., 5001)
- Frontend: Vite will automatically use next available port

### Issue 4: CORS errors

**Solution**: 
1. Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Default frontend URL is `http://localhost:5173`

### Issue 5: Razorpay payment not working

**Solution**:
1. Verify `VITE_RAZORPAY_KEY_ID` in frontend matches `RAZORPAY_KEY_ID` in backend
2. Ensure you're using Test Mode keys
3. Check browser console for errors

---

## Production Deployment

### Backend Deployment (Render)

1. Push code to GitHub
2. Create account on [Render](https://render.com)
3. Create new Web Service
4. Connect GitHub repository
5. Set environment variables in Render dashboard
6. Deploy

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Create account on [Vercel](https://vercel.com)
3. Import GitHub repository
4. Set environment variables:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_RAZORPAY_KEY_ID`: Razorpay Live Key ID
5. Deploy

### Update Environment for Production

**Backend `.env`:**
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Frontend `.env`:**
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_your_live_key_here
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Investments
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `POST /api/goals/:id/contribute` - Add contribution

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/charts/expenses` - Expense chart data
- `GET /api/dashboard/charts/categories` - Category breakdown

### Admin
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/block` - Block/unblock user

---

## Project Structure Overview

```
FinTrack Pro/
├── backend/              # Node.js + Express API
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── server.js        # Entry point
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   └── index.html
└── docs/                # Documentation
```

---

## Support & Resources

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Razorpay Docs**: https://razorpay.com/docs/
- **React Docs**: https://react.dev/
- **Express Docs**: https://expressjs.com/

---

## Next Steps

1. Complete environment setup
2. Run both servers
3. Register your first user
4. Explore all features
5. Customize as needed
6. Deploy to production

Happy coding! 🚀
