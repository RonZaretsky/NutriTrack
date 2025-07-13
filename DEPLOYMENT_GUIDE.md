# 🚀 Cloud Deployment Guide

Your nutrition tracking app is now ready for cloud deployment! Here are the best options with step-by-step instructions.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **Environment Variables Ready:**
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
   ```

2. **Supabase Database Configured:**
   - All tables created
   - RLS policies set up
   - Authentication configured

3. **Git Repository:**
   - Code pushed to GitHub/GitLab

## 🎯 Deployment Options

### **Option 1: Vercel (Recommended - Easiest)**

**Pros:** Free tier, automatic deployments, great performance
**Best for:** Quick deployment, personal projects

#### Steps:
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all your environment variables

4. **Automatic Deployments:**
   - Connect your GitHub repo to Vercel
   - Every push to main branch will auto-deploy

#### Alternative: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set environment variables
5. Deploy!

---

### **Option 2: Netlify**

**Pros:** Free tier, form handling, great for static sites
**Best for:** Static sites with forms

#### Steps:
1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add all your environment variables

#### Alternative: Deploy via Netlify Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables
7. Deploy!

---

### **Option 3: GitHub Pages**

**Pros:** Free, integrated with GitHub
**Best for:** Open source projects, GitHub users

#### Steps:
1. **Enable GitHub Pages:**
   - Go to your repository → Settings → Pages
   - Source: "GitHub Actions"

2. **Set Repository Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Add all environment variables as secrets

3. **Push to Main Branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Check Deployment:**
   - Go to Actions tab to see deployment progress
   - Your site will be available at: `https://username.github.io/repository-name`

---

### **Option 4: Docker (Any Cloud Platform)**

**Pros:** Portable, works on any cloud
**Best for:** AWS, Google Cloud, Azure, DigitalOcean

#### Steps:
1. **Build Docker Image:**
   ```bash
   docker build -t nutri-track-app .
   ```

2. **Test Locally:**
   ```bash
   docker run -p 3000:80 nutri-track-app
   ```

3. **Deploy to Cloud:**

   **AWS:**
   ```bash
   # Build and push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
   docker tag nutri-track-app:latest your-account.dkr.ecr.us-east-1.amazonaws.com/nutri-track-app:latest
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/nutri-track-app:latest
   ```

   **Google Cloud:**
   ```bash
   # Build and push to Container Registry
   docker tag nutri-track-app gcr.io/your-project/nutri-track-app
   docker push gcr.io/your-project/nutri-track-app
   ```

   **DigitalOcean:**
   ```bash
   # Deploy to App Platform
   doctl apps create --spec app.yaml
   ```

---

### **Option 5: Firebase Hosting**

**Pros:** Google's infrastructure, fast CDN
**Best for:** Google ecosystem users

#### Steps:
1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase:**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configure firebase.json:**
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## 🔧 Environment Variables Setup

### **For All Platforms:**

Set these environment variables in your deployment platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=sk-your_openai_api_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### **Important Notes:**
- ✅ **VITE_** prefix is required for Vite to expose variables to the client
- ✅ Keep your API keys secure
- ✅ Never commit `.env` files to Git
- ✅ Use different keys for development and production

---

## 🚀 Quick Deploy Commands

### **Vercel (Fastest):**
```bash
npm i -g vercel
vercel
```

### **Netlify:**
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### **GitHub Pages:**
```bash
git add .
git commit -m "Deploy"
git push origin main
```

---

## 🔍 Post-Deployment Checklist

After deploying, verify:

1. **✅ App loads correctly**
2. **✅ Authentication works**
3. **✅ Database connections work**
4. **✅ AI features function**
5. **✅ File uploads work**
6. **✅ All pages are accessible**
7. **✅ Mobile responsiveness**
8. **✅ Performance is good**

---

## 🛠️ Troubleshooting

### **Common Issues:**

1. **Environment Variables Not Working:**
   - Check variable names start with `VITE_`
   - Redeploy after adding variables

2. **404 Errors on Refresh:**
   - Ensure SPA routing is configured
   - Check `vercel.json` or `netlify.toml`

3. **Build Failures:**
   - Check Node.js version (use 18+)
   - Verify all dependencies are installed

4. **CORS Issues:**
   - Configure Supabase CORS settings
   - Add your domain to allowed origins

---

## 📊 Performance Optimization

### **After Deployment:**

1. **Enable Compression:**
   - Gzip/Brotli compression
   - Already configured in nginx.conf

2. **Cache Static Assets:**
   - Already configured in deployment files

3. **Monitor Performance:**
   - Use Lighthouse for audits
   - Monitor Core Web Vitals

---

## 🎉 Success!

Your nutrition tracking app is now live! Share your deployment URL and start tracking nutrition with AI-powered insights.

**Recommended Next Steps:**
1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domain
3. Set up SSL certificates
4. Monitor performance and errors
5. Plan for scaling

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Check browser console for errors
4. Verify environment variables are set correctly 