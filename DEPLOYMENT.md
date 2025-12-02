# Deployment Guide

## Quick Deploy to Vercel (Recommended - 5 minutes)

Vercel is the easiest and free option for deploying this app.

### Step 1: Prepare Your Repository

```bash
# Initialize git if you haven't already
cd cover-letter-app
git init
git add .
git commit -m "Initial commit - Cover Letter Generator"

# Create a GitHub repository and push
# (Go to github.com and create a new repository)
git remote add origin https://github.com/YOUR_USERNAME/cover-letter-generator.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Fastest)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from cover-letter-app directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? cover-letter-generator (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `cover-letter-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"

Done! Your app will be live at `https://your-project.vercel.app`

### Step 3: Configure Environment Variables (Optional)

If you want to add OpenAI integration later:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - Key: `VITE_OPENAI_API_KEY`
   - Value: `your_api_key_here`
4. Redeploy

---

## Alternative: Deploy to Netlify (Also Free)

### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd cover-letter-app
netlify deploy

# Follow prompts, then deploy to production
netlify deploy --prod
```

### Using Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Configure:
   - **Base directory**: `cover-letter-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `cover-letter-app/dist`
6. Click "Deploy"

---

## Alternative: Deploy to GitHub Pages (Free, Static Only)

**Note**: GitHub Pages doesn't support serverless functions, so API endpoints won't work. The app will work with template generation only.

### Step 1: Update vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cover-letter-generator/', // Replace with your repo name
})
```

### Step 2: Add Deployment Script

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Step 3: Install and Deploy

```bash
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

Your app will be at: `https://YOUR_USERNAME.github.io/cover-letter-generator/`

---

## Alternative: Deploy to Cloudflare Pages (Free)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up/login
3. Click "Create a project"
4. Connect to GitHub
5. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `cover-letter-app`
6. Click "Save and Deploy"

---

## Custom Domain Setup

### For Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL is automatic

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records
4. SSL is automatic

---

## Post-Deployment Checklist

### ✅ Test Core Features
- [ ] Create a profile
- [ ] Add a job posting
- [ ] Generate a cover letter
- [ ] Edit the letter
- [ ] Export to PDF
- [ ] Export to DOCX
- [ ] Export to TXT
- [ ] Search in library
- [ ] Delete a letter

### ✅ Test on Different Devices
- [ ] Desktop browser
- [ ] Mobile browser
- [ ] Tablet

### ✅ Test Different Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Monitoring & Analytics (Optional)

### Add Vercel Analytics

```bash
npm install @vercel/analytics
```

In `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
```

### Add Error Tracking (Sentry - Free Tier)

```bash
npm install @sentry/react
```

In `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## Updating Your Deployment

### Vercel (Automatic)
- Just push to your GitHub repository
- Vercel automatically rebuilds and deploys

### Manual Update
```bash
cd cover-letter-app
git add .
git commit -m "Update: description of changes"
git push

# If using Vercel CLI
vercel --prod

# If using Netlify CLI
netlify deploy --prod
```

---

## Cost Breakdown

### Free Tier Limits (Vercel)
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours serverless function execution
- ✅ Unlimited projects
- ✅ Automatic SSL
- ✅ Custom domains
- ✅ Preview deployments

**Your app will stay FREE for:**
- Up to ~10,000 users/month
- Unlimited cover letter generations (template-based)

### If You Add OpenAI API
- OpenAI GPT-3.5-turbo: ~$0.003 per cover letter
- 1,000 generations = ~$3
- 10,000 generations = ~$30

---

## Troubleshooting Deployment

### Build Fails
```bash
# Test build locally first
npm run build

# Check for errors
npm run preview
```

### API Routes Not Working
- Vercel: Ensure `api/` folder is in the root
- Netlify: Use Netlify Functions instead
- GitHub Pages: API routes not supported (use template generation)

### Environment Variables Not Working
- Prefix with `VITE_` for client-side access
- Redeploy after adding variables
- Check they're set in the correct environment (production)

### App Not Loading
- Check browser console for errors
- Verify `base` path in vite.config.ts
- Check if all dependencies are in package.json

### IndexedDB Issues
- Some browsers block IndexedDB in private mode
- Check browser compatibility
- Provide fallback message to users

---

## Production Optimizations (Optional)

### 1. Enable Compression

Vercel does this automatically. For others, add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' })
  ],
})
```

### 2. Add PWA Support

```bash
npm install vite-plugin-pwa -D
```

### 3. Optimize Images

```bash
npm install vite-plugin-imagemin -D
```

### 4. Add Caching Headers

In `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Security Checklist

- ✅ All data stored locally (IndexedDB)
- ✅ No sensitive data sent to servers
- ✅ HTTPS enforced (automatic on Vercel/Netlify)
- ✅ No authentication required (privacy-first)
- ✅ API keys stored in environment variables
- ✅ CORS configured properly

---

## Support & Maintenance

### Regular Updates
- Update dependencies monthly: `npm update`
- Check for security issues: `npm audit`
- Test after updates: `npm run build && npm run preview`

### Backup Strategy
- User data is local (IndexedDB)
- Recommend users export their letters regularly
- Consider adding export/import profile feature

---

## Success! 🎉

Your Cover Letter Generator is now live and helping people create amazing cover letters!

**Share your deployment:**
- Tweet about it
- Share on LinkedIn
- Add to your portfolio
- Submit to Product Hunt

**Next Steps:**
- Monitor usage with analytics
- Gather user feedback
- Iterate on features
- Consider monetization (premium features)

Need help? Check the other docs:
- `README.md` - Full documentation
- `QUICKSTART.md` - User guide
- `FEATURES.md` - Feature list
