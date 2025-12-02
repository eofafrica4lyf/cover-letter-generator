# 🔧 API Troubleshooting Guide

## Issue: "Development Mode" Message in Production

If you're seeing the "Development Mode" message on your deployed Vercel app, follow these steps:

### Step 1: Verify Deployment

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Check the latest deployment status
4. Make sure it says "Ready" (not "Building" or "Error")

### Step 2: Check API Functions

1. In Vercel dashboard, click on your deployment
2. Click the "Functions" tab
3. You should see:
   - `/api/parse`
   - `/api/generate`
   - `/api/translate`
4. If you don't see these, the API functions aren't deployed

### Step 3: Verify Root Directory

1. Go to Project Settings → General
2. Check "Root Directory" is set to: `cover-letter-app`
3. If not, update it and redeploy

### Step 4: Check Environment Variables

1. Go to Project Settings → Environment Variables
2. Verify `OPENAI_API_KEY` exists
3. Make sure it's enabled for "Production"
4. If missing or wrong, add/update it and redeploy

### Step 5: Test API Directly

Open your browser console and run:

```javascript
fetch('https://your-domain.vercel.app/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Expected response:**
```json
{
  "status": "ok",
  "apiConfigured": true
}
```

**If you get an error:**
- 404: API functions not deployed
- 503: OpenAI API key not configured
- Network error: CORS or routing issue

### Step 6: Check Browser Console

1. Open your deployed app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for messages like:
   - "API check response: 200" ✅ Good
   - "API check failed: ..." ❌ Problem
5. Check the Network tab for the `/api/parse` request

### Step 7: Force Redeploy

Sometimes Vercel needs a fresh deployment:

```bash
# Option 1: Push a small change
git commit --allow-empty -m "Force redeploy"
git push

# Option 2: Redeploy from dashboard
# Go to Deployments → Click "..." → Redeploy
```

### Step 8: Check Build Logs

1. Go to Deployments in Vercel
2. Click on the latest deployment
3. Check the build logs for errors
4. Look for:
   - "Building Functions" section
   - Any errors related to `api/` folder
   - TypeScript compilation errors

## Common Issues & Solutions

### Issue: 404 on /api/parse

**Cause:** API functions not deployed

**Solution:**
1. Verify `api/` folder exists in your repo
2. Check `vercel.json` has functions configuration
3. Redeploy

### Issue: 503 Service Unavailable

**Cause:** OpenAI API key not configured

**Solution:**
1. Add `OPENAI_API_KEY` to Vercel environment variables
2. Make sure it's enabled for Production
3. Redeploy

### Issue: CORS Error

**Cause:** API route configuration issue

**Solution:**
1. Check `vercel.json` configuration
2. Make sure no conflicting rewrites
3. API routes should work automatically in Vercel

### Issue: "Cannot find module 'openai'"

**Cause:** Dependencies not installed

**Solution:**
1. Check `package.json` includes all dependencies
2. Run `npm install` locally to verify
3. Commit `package.json` and `package-lock.json`
4. Redeploy

### Issue: Still Shows Development Mode

**Cause:** Browser cache or production check failing

**Solution:**
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear browser cache
3. Try incognito/private window
4. Check console for actual error

## Verification Checklist

Before asking for help, verify:

- [ ] Latest code is pushed to GitHub
- [ ] Vercel deployment shows "Ready"
- [ ] Root directory is set to `cover-letter-app`
- [ ] `OPENAI_API_KEY` is configured in Vercel
- [ ] API functions appear in Functions tab
- [ ] `/api/parse` test request returns 200
- [ ] Browser console shows no errors
- [ ] Hard refresh performed (Cmd+Shift+R)

## Manual Test

To manually test if the API is working:

1. Go to: `https://your-domain.vercel.app/api/parse`
2. You should see: "Method not allowed" (this is correct - it needs POST)
3. If you see 404, the API isn't deployed
4. If you see 503, the API key isn't configured

## Debug Mode

Add this to your browser console to see detailed info:

```javascript
// Check production detection
localStorage.setItem('debug', 'true');
location.reload();

// Then check console for debug messages
```

## Still Not Working?

1. **Check Vercel Status:** https://www.vercel-status.com
2. **Check OpenAI Status:** https://status.openai.com
3. **Review Vercel Logs:** Dashboard → Functions → View logs
4. **Check Network Tab:** Look for failed requests

## Quick Fix

If nothing else works, try this:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Test build locally
npm run build

# 3. Commit and push
git add .
git commit -m "Clean rebuild"
git push

# 4. Wait for Vercel deployment
# 5. Hard refresh browser
```

## Contact Support

If still not working, gather this info:
- Vercel deployment URL
- Browser console errors (screenshot)
- Network tab showing /api/parse request (screenshot)
- Vercel function logs (screenshot)

Then check:
- Vercel documentation: https://vercel.com/docs
- Vercel support: https://vercel.com/support
