# 🚀 MERN Social Media App - Deployment Guide

## Prerequisites
- GitHub account
- Render account
- MongoDB Atlas account

## 📋 Step-by-Step Deployment

### 1. MongoDB Atlas Setup

#### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

#### 1.2 Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select cloud provider (AWS/Google Cloud/Azure)
4. Choose region close to your users
5. Click "Create"

#### 1.3 Database Access
1. Go to "Database Access" → "Add New Database User"
2. Choose "Password" authentication
3. Create username and password (save these!)
4. Select "Read and write to any database"
5. Click "Add User"

#### 1.4 Network Access
1. Go to "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

#### 1.5 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `mern-social-media`

### 2. Backend Deployment (Vercel)

#### 2.1 Prepare Backend
1. Ensure `package.json` has start script:
   ```json
   "scripts": {
     "dev": "nodemon server.js",
     "start": "node server.js"
   }
   ```

#### 2.2 Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Node.js
   - **Root Directory**: ./
   - **Build Command**: `npm install`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

#### 2.3 Environment Variables
Add these in Render dashboard → Environment:
```
MONGODB_URL=mongodb+srv://ramnathbaskar23cse:<db_password>@fullstack.laewkmf.mongodb.net/mern-social-media?retryWrites=true&w=majority&appName=fullstack
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
NODE_ENV=production
```

#### 2.4 Get Backend URL
After deployment, copy your backend URL: `https://mern-social-media-roeo.vercel.app`

### 3. Frontend Deployment (Render)

#### 3.1 Update Frontend Configuration
1. Update `client/package.json`:
   ```json
   "proxy": "https://mern-social-media-roeo.vercel.app"
   ```

2. Update `client/src/utils/fetchData.js`:
   ```javascript
   const api = axios.create({
       baseURL: process.env.NODE_ENV === 'production' 
           ? 'https://mern-social-media-roeo.vercel.app/api'
           : '/api'
   });
   ```

#### 3.2 Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `mern-social-media-frontend`
   - **Build Command**: `cd client && npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `client/build`

#### 3.3 Environment Variables
Add these in Render dashboard → Environment:
```
REACT_APP_API_URL=https://mern-social-media-roeo.vercel.app
NODE_ENV=production
```

### 4. Final Configuration

#### 4.1 Update URLs
Replace all instances of `your-backend-app-name` with your actual backend app name in:
- `client/package.json`
- `client/src/utils/fetchData.js`
- `client/src/utils/config.js`

#### 4.2 Test Your Deployment
1. Visit your frontend URL
2. Register a new account
3. Create a post
4. Test all features

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure backend CORS is configured for your frontend domain
2. **Database Connection**: Verify MongoDB Atlas connection string and network access
3. **Environment Variables**: Double-check all variables are set correctly in Render
4. **Build Failures**: Check build logs in Render dashboard

### Useful Commands:
```bash
# Test backend locally with Atlas
npm start

# Test frontend locally
cd client && npm start

# Check logs in Render
# Go to your service → Logs
```

## 🌐 Your Live URLs
- **Frontend**: `https://your-frontend-app-name.onrender.com` (or Vercel)
- **Backend**: `https://mern-social-media-roeo.vercel.app`
- **Database**: MongoDB Atlas (cloud-hosted)

## 📞 Support
If you encounter issues:
1. Check Render deployment logs
2. Verify MongoDB Atlas connection
3. Test API endpoints using Postman
4. Check browser console for frontend errors
