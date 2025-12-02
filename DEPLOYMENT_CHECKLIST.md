# 🚀 Deployment Checklist

Complete this checklist before deploying to production.

## ✅ Pre-Deployment

### 1. Dependencies
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Verify `package.json` includes:
  - `openai` (^4.20.1)
  - `cheerio` (^1.0.0-rc.12)
  - `@vercel/node` (^3.0.12)

### 2. Environment Variables
- [ ] Get OpenAI API key from https://platform.openai.com/api-keys
- [ ] Test API key locally (optional)
- [ ] Prepare to add to Vercel

### 3. Configuration Files
- [ ] Update `public/sitemap.xml` with your actual domain
- [ ] Update `public/robots.txt` with your actual domain
- [ ] Update `index.html` meta tags with your actual domain

### 4. Build Test
- [ ] Run `npm run build` locally
- [ ] Verify build succeeds without errors
- [ ] Check `dist/` folder is created

## 🔧 Vercel Setup

### 1. Initial Deployment
- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Connect repository to Vercel
- [ ] Set root directory to `cover-letter-app`
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### 2. Environment Variables
- [ ] Go to Project Settings → Environment Variables
- [ ] Add `OPENAI_API_KEY`:
  - Name: `OPENAI_API_KEY`
  - Value: Your OpenAI API key (sk-...)
  - Environments: Production, Preview, Development
- [ ] Save changes

### 3. Deploy
- [ ] Click "Deploy" or push to main branch
- [ ] Wait for deployment to complete
- [ ] Note your deployment URL

## ✅ Post-Deployment

### 1. Update Domain References
- [ ] Replace `https://your-domain.vercel.app` in:
  - `public/sitemap.xml` (all `<loc>` tags)
  - `public/robots.txt` (sitemap URL)
  - `index.html` (og:url meta tag)
- [ ] Commit and push changes
- [ ] Redeploy

### 2. Verify Deployment
- [ ] Visit your deployed URL
- [ ] Check homepage loads correctly
- [ ] Verify all routes work:
  - [ ] `/` (Home)
  - [ ] `/profile` (Profile)
  - [ ] `/jobs` (Jobs)
  - [ ] `/library` (Library)

### 3. Test Static Files
- [ ] Visit `https://your-domain.vercel.app/robots.txt`
- [ ] Visit `https://your-domain.vercel.app/sitemap.xml`
- [ ] Both should load correctly

### 4. Test API Endpoints

#### Test URL Scraping
- [ ] Go to Jobs page
- [ ] Click "URL" tab
- [ ] Should show "✅ Production Mode: URL scraping is available!"
- [ ] Try scraping a job posting URL (e.g., from LinkedIn, Indeed)
- [ ] Verify job details are extracted

#### Test Text Parsing
- [ ] Click "Paste Text" tab
- [ ] Paste a job posting
- [ ] Click "Parse Text"
- [ ] Verify job details are extracted

#### Test Cover Letter Generation
- [ ] Create a profile (if not exists)
- [ ] Add a job posting
- [ ] Go to Generator page
- [ ] Select job and generate
- [ ] Verify cover letter is created with AI content (not template)

### 5. Check Vercel Logs
- [ ] Go to Vercel Dashboard → Deployments
- [ ] Click on latest deployment
- [ ] Click "Functions" tab
- [ ] Check logs for `/api/parse` and `/api/generate`
- [ ] Verify no errors

### 6. Monitor OpenAI Usage
- [ ] Visit https://platform.openai.com/usage
- [ ] Verify API calls are being logged
- [ ] Check costs are as expected

## 🔒 Security Check

- [ ] Verify `OPENAI_API_KEY` is not exposed in:
  - [ ] Client-side code
  - [ ] Browser console
  - [ ] Network requests (should only be in server-side)
  - [ ] Git repository
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Set spending limits in OpenAI dashboard

## 🎯 SEO & Discovery

### 1. Search Console Setup
- [ ] Submit to Google Search Console
  - [ ] Add property
  - [ ] Verify ownership
  - [ ] Submit sitemap: `https://your-domain.vercel.app/sitemap.xml`
- [ ] Submit to Bing Webmaster Tools
  - [ ] Add site
  - [ ] Submit sitemap

### 2. Test SEO
- [ ] Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Check meta tags in page source

## 📊 Performance Check

- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify page load times
- [ ] Test on mobile devices

## 🐛 Troubleshooting

If something doesn't work:

### API Not Working
1. Check Vercel environment variables are set
2. Verify OpenAI API key is valid
3. Check function logs in Vercel dashboard
4. Verify OpenAI account has credits

### URL Scraping Fails
1. Some sites block scraping - this is normal
2. Try "Paste Text" as alternative
3. Check if URL is publicly accessible

### Build Fails
1. Check all dependencies are installed
2. Verify TypeScript has no errors
3. Check Vercel build logs

## ✅ Final Checklist

Before announcing your app:
- [ ] All features tested and working
- [ ] API key configured and working
- [ ] Domain references updated
- [ ] SEO configured
- [ ] Security verified
- [ ] Costs monitored
- [ ] Documentation reviewed

## 🎉 You're Live!

Your Cover Letter Generator is now deployed with full AI capabilities!

**Share your app:**
- [ ] Share URL with friends
- [ ] Post on social media
- [ ] Add to portfolio

**Monitor:**
- [ ] Check Vercel analytics
- [ ] Monitor OpenAI usage
- [ ] Review user feedback

---

**Need help?** Check:
- `API_SETUP.md` - Detailed API configuration
- `PRODUCTION_READY.md` - Production features
- `README.md` - General documentation
