# Free Hosting Guide

This guide will help you deploy your website for free using **Render** (recommended) or other free hosting services.

## Option 1: Render (Recommended - Easiest)

### Step 1: Prepare Your Code

1. **Make sure your code is ready:**
   - ✅ `package.json` exists with `start` script
   - ✅ `server.js` uses `process.env.PORT` (already done)
   - ✅ All files are in the project folder

2. **Create a GitHub repository** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   
   Then push to GitHub:
   - Go to [GitHub](https://github.com) and create a new repository
   - Follow the instructions to push your code

### Step 2: Deploy on Render

1. **Sign up for Render:**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account (free)

2. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure the service:**
   - **Name:** `your-engagement-website` (or any name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (select Free tier)

4. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your site will be live at: `https://your-engagement-website.onrender.com`

### Step 3: Important Notes for Render

⚠️ **Free tier limitations:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- File uploads are stored temporarily (may be lost on restart)

✅ **To keep it always running (optional):**
- Upgrade to paid plan, OR
- Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping your site every 5 minutes

---

## Option 2: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys
6. Your site will be at: `https://your-project.railway.app`

**Free tier:** $5 credit/month (usually enough for small sites)

---

## Option 3: Fly.io (Alternative)

1. Install Fly CLI: `npm install -g flyctl`
2. Sign up: `flyctl auth signup`
3. Deploy: `flyctl launch`
4. Follow the prompts

**Free tier:** 3 shared VMs, 160GB outbound data/month

---

## Option 4: Cyclic (Alternative)

1. Go to [cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. Connect repository
4. Auto-deploys

**Free tier:** Always-on, no spin-down

---

## Important: File Storage

⚠️ **All free hosting services have ephemeral storage** - uploaded files may be lost when the service restarts.

### Solutions:

1. **Use cloud storage** (recommended):
   - Integrate with **Cloudinary** (free tier: 25GB)
   - Or **AWS S3** (free tier: 5GB)
   - Or **Google Cloud Storage**

2. **Use a database** for file metadata:
   - **MongoDB Atlas** (free tier: 512MB)
   - **Supabase** (free tier: 500MB)

3. **Accept the limitation** for free hosting:
   - Photos uploaded via the website may be temporary
   - Pre-upload photos to `photos/` folder before deployment

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] `package.json` has `start` script
- [ ] `server.js` uses `process.env.PORT`
- [ ] All dependencies in `package.json`
- [ ] `.gitignore` excludes `node_modules` (not `/photos/`)
- [ ] Test locally: `npm install && npm start`

---

## After Deployment

1. **Test your site:**
   - Visit your deployed URL
   - Check if images load
   - Test photo upload (if using cloud storage)

2. **Custom domain (optional):**
   - Render: Settings → Custom Domain
   - Add your domain DNS records
   - Free SSL included

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Support:** Check hosting provider's documentation

