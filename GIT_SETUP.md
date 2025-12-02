# 🔄 Git & Auto-Deploy Setup

This guide shows you how to set up automatic deployments with Vercel.

## 🎯 Recommended: Git + Vercel Integration

This is the easiest way - push to main, and Vercel automatically deploys!

### Step 1: Create Git Repository

If you haven't already initialized Git:

```bash
cd cover-letter-app
git init
git add .
git commit -m "Initial commit: Cover Letter Generator with AI"
```

### Step 2: Create GitHub Repository

**Option A: Using GitHub CLI**
```bash
gh repo create cover-letter-generator --public --source=. --remote=origin
git push -u origin main
```

**Option B: Using GitHub Website**
1. Go to https://github.com/new
2. Repository name: `cover-letter-generator`
3. Choose Public or Private
4. Don't initialize with README (we already have code)
5. Click "Create repository"
6. Follow the instructions to push existing code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cover-letter-generator.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Connect to Vercel

1. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Sign in with GitHub (recommended)

2. **Import Repository:**
   - Click "Import Project"
   - Select "Import Git Repository"
   - Find your `cover-letter-generator` repo
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `cover-letter-generator` (or your choice)
   - **Framework Preset:** Vite
   - **Root Directory:** `cover-letter-app` ⚠️ Important!
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** Your OpenAI API key (sk-...)
     - **Environments:** Check all (Production, Preview, Development)
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for first deployment
   - You'll get a URL like: `https://cover-letter-generator-xyz.vercel.app`

### Step 4: Test Auto-Deploy

Now test that auto-deploy works:

```bash
# Make a small change
echo "# Auto-deploy test" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deploy"
git push
```

**What happens:**
1. Vercel detects the push
2. Automatically starts building
3. Deploys to production
4. You get a notification (if enabled)

Check your Vercel dashboard to see the deployment in progress!

## 🔧 Vercel Settings

### Production Branch
By default, Vercel deploys the `main` branch to production.

To change this:
1. Go to Project Settings
2. Click "Git"
3. Change "Production Branch" to your preferred branch

### Preview Deployments
Vercel automatically creates preview deployments for:
- Pull requests
- Pushes to non-production branches

Each gets a unique URL for testing!

### Deployment Protection
To prevent accidental deployments:
1. Go to Project Settings → Deployment Protection
2. Enable "Vercel Authentication"
3. Only authenticated users can access previews

## 📝 .gitignore

Make sure your `.gitignore` includes:

```gitignore
# Dependencies
node_modules/

# Build output
dist/
.vercel/

# Environment variables
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.DS_Store
.vscode/
.idea/

# Testing
coverage/
```

## 🚀 Workflow

Your typical workflow will be:

```bash
# 1. Make changes to your code
# Edit files...

# 2. Test locally
npm run dev

# 3. Build to verify
npm run build

# 4. Commit changes
git add .
git commit -m "Add new feature"

# 5. Push to GitHub
git push

# 6. Vercel automatically deploys! 🎉
# Check https://vercel.com/dashboard for status
```

## 🌿 Branch Strategy

### Simple Strategy (Recommended for Solo)
- `main` → Production
- Push directly to main
- Vercel auto-deploys

### Team Strategy
- `main` → Production (protected)
- `develop` → Staging
- Feature branches → Preview deployments
- Use Pull Requests to merge

**Setup protected branch:**
1. GitHub → Settings → Branches
2. Add rule for `main`
3. Require pull request reviews
4. Require status checks (Vercel build)

## 🔔 Notifications

Get notified when deployments complete:

1. **Vercel Dashboard:**
   - Settings → Notifications
   - Enable email/Slack notifications

2. **GitHub:**
   - Vercel automatically comments on PRs
   - Shows deployment status

## 🐛 Troubleshooting

### "Build failed"
- Check Vercel build logs
- Verify `npm run build` works locally
- Check all dependencies are in `package.json`

### "Root directory not found"
- Verify Root Directory is set to `cover-letter-app`
- Check the path in Vercel settings

### "Environment variable not found"
- Verify `OPENAI_API_KEY` is added
- Check it's enabled for Production
- Redeploy after adding variables

### "Git push rejected"
- Pull latest changes: `git pull origin main`
- Resolve conflicts if any
- Push again: `git push`

## 📊 Monitoring Deployments

### Vercel Dashboard
- View all deployments
- Check build logs
- See function logs
- Monitor analytics

### GitHub
- See deployment status on commits
- Check deployment URLs in PR comments
- View deployment history

## 🎯 Advanced: Custom Domain

Once deployed, add a custom domain:

1. **Buy domain** (Namecheap, Google Domains, etc.)

2. **Add to Vercel:**
   - Project Settings → Domains
   - Add your domain
   - Follow DNS instructions

3. **Update references:**
   - Update `sitemap.xml`
   - Update `robots.txt`
   - Update `index.html` meta tags
   - Commit and push

## ✅ Checklist

- [ ] Git repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Repository connected to Vercel
- [ ] Root directory set to `cover-letter-app`
- [ ] `OPENAI_API_KEY` environment variable added
- [ ] First deployment successful
- [ ] Auto-deploy tested (push to main)
- [ ] Deployment notifications configured
- [ ] `.gitignore` properly configured

## 🎉 You're Set!

Now every time you push to main:
```bash
git push
```

Vercel automatically:
1. ✅ Detects the push
2. ✅ Installs dependencies
3. ✅ Runs build
4. ✅ Deploys to production
5. ✅ Notifies you

**No manual deployment needed!** 🚀

---

**Next Steps:**
- Make changes to your code
- Push to GitHub
- Watch Vercel deploy automatically
- Share your live URL!
