# 🔑 API Setup Guide

Your Cover Letter Generator now uses **real AI-powered features** for URL scraping, text parsing, and cover letter generation.

## 🚀 Features Implemented

### ✅ URL Scraping (`/api/parse`)
- Fetches job postings from any URL
- Extracts text content using Cheerio
- Parses with OpenAI GPT-4o-mini
- Returns structured job data

### ✅ Text Parsing (`/api/parse`)
- Accepts pasted job posting text
- Uses AI to extract job details
- Identifies company, title, requirements, etc.

### ✅ File Upload (`/api/parse`)
- Supports PDF and DOCX files
- Extracts text content
- Parses with AI

### ✅ AI Cover Letter Generation (`/api/generate`)
- Uses OpenAI GPT-4o for high-quality letters
- Personalized based on user profile
- Multi-language support
- Customizable tone
- Fallback to templates if API fails

## 📋 Setup Instructions

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Important:** Save it securely - you won't see it again!

### Step 2: Add API Key to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to your project on https://vercel.com
2. Click on "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add a new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (sk-...)
   - **Environment:** Select all (Production, Preview, Development)
5. Click "Save"

#### Option B: Vercel CLI
```bash
vercel env add OPENAI_API_KEY
# Paste your API key when prompted
# Select all environments
```

### Step 3: Redeploy

After adding the environment variable, redeploy:

```bash
cd cover-letter-app
npm run deploy
```

Or trigger a redeploy from the Vercel dashboard.

### Step 4: Verify

1. Visit your deployed app
2. Go to "Job Posting" section
3. Try the URL tab - you should see "✅ Production Mode"
4. Test scraping a job posting URL
5. Generate a cover letter

## 💰 Cost Considerations

### OpenAI Pricing (as of Dec 2024)

**GPT-4o-mini** (used for parsing):
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- ~$0.001 per job posting parse

**GPT-4o** (used for generation):
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- ~$0.02-0.05 per cover letter

### Estimated Costs
- **Light use** (10 letters/month): ~$0.50/month
- **Moderate use** (50 letters/month): ~$2.50/month
- **Heavy use** (200 letters/month): ~$10/month

### Free Tier
- OpenAI offers $5 in free credits for new accounts
- Good for ~100-250 cover letters

## 🔒 Security Best Practices

### ✅ DO:
- Store API key in Vercel environment variables
- Never commit API keys to Git
- Use `.env.local` for local development (gitignored)
- Monitor your OpenAI usage dashboard
- Set spending limits in OpenAI dashboard

### ❌ DON'T:
- Never expose API keys in client-side code
- Don't share your API key
- Don't commit `.env.local` to Git
- Don't use API keys in URLs or logs

## 🧪 Local Development

For local testing:

1. Create `.env.local` file:
```bash
echo "OPENAI_API_KEY=your_key_here" > .env.local
```

2. Run development server:
```bash
npm run dev
```

3. Test the APIs at:
- http://localhost:5173

**Note:** Vercel serverless functions don't run locally with Vite. For full local testing, use `vercel dev` instead of `npm run dev`.

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check that you added `OPENAI_API_KEY` to Vercel environment variables
- Verify the key is correct (starts with `sk-`)
- Redeploy after adding the variable

### "Failed to scrape URL"
- Some websites block scraping
- Try using "Paste Text" instead
- Check if the URL is accessible

### "AI parsing failed"
- Check your OpenAI account has credits
- Verify API key is valid
- Check OpenAI status: https://status.openai.com

### Rate Limits
- OpenAI has rate limits for API calls
- Free tier: 3 requests/minute
- Paid tier: Higher limits based on usage tier

## 📊 Monitoring

### OpenAI Dashboard
Monitor your usage at: https://platform.openai.com/usage

### Vercel Logs
Check function logs in Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. Click "Functions" tab
5. View logs for `/api/parse` and `/api/generate`

## 🎯 API Endpoints

### POST /api/parse
Parse job postings from various sources.

**Request:**
```json
{
  "source": "url" | "text" | "file",
  "content": "URL or text content or base64",
  "filename": "optional for files"
}
```

**Response:**
```json
{
  "jobTitle": "Software Engineer",
  "companyName": "Tech Corp",
  "description": "Full job description...",
  "requirements": ["Requirement 1", "Requirement 2"],
  "language": "en",
  "positionType": "full-time",
  "confidence": 0.85
}
```

### POST /api/generate
Generate personalized cover letters.

**Request:**
```json
{
  "jobPosting": { /* job data */ },
  "userProfile": { /* user data */ },
  "language": "en",
  "tone": "professional",
  "additionalNotes": "optional",
  "additionalInfo": "optional"
}
```

**Response:**
```json
{
  "content": "Full cover letter text...",
  "language": "en",
  "tokensUsed": 450
}
```

## 🔄 Fallback Behavior

If OpenAI API fails or is not configured:
- Parse endpoints return error with helpful message
- Generate endpoint falls back to template-based generation
- App remains functional with reduced features

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Usage Limits](https://platform.openai.com/account/limits)

## ✅ Checklist

Before going live:
- [ ] OpenAI API key obtained
- [ ] API key added to Vercel environment variables
- [ ] App redeployed
- [ ] URL scraping tested
- [ ] Cover letter generation tested
- [ ] Spending limits set in OpenAI dashboard
- [ ] Usage monitoring enabled

---

**You're all set!** Your app now has full AI-powered functionality. 🎉
