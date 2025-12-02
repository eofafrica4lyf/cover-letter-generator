# 🌍 Translation Feature

## Overview

The app now includes automatic translation functionality that allows you to translate job descriptions between languages on-the-fly.

## How It Works

### 1. Automatic Language Detection
When you scrape a URL or parse text:
- The AI automatically detects the language of the job posting
- The language dropdown is set to the detected language
- The description is stored in its original language

### 2. On-Demand Translation
When you change the language dropdown:
1. The app asks: "Would you like to translate the job description to [Language]?"
2. If you click **Yes**:
   - The description is translated using OpenAI GPT-4o-mini
   - The translated text replaces the original
   - A "Translating..." indicator shows during the process
3. If you click **No**:
   - Only the language field is updated
   - The description remains unchanged

### 3. Smart Translation
The translation:
- Maintains the original meaning and tone
- Preserves technical terms appropriately
- Keeps formatting intact
- Uses professional translation quality

## Usage Examples

### Example 1: German Job → English
1. Scrape a German job posting URL
2. Language is detected as "German"
3. Change dropdown to "English"
4. Click "Yes" to translate
5. Description is now in English
6. Generate cover letter in English

### Example 2: English Job → French
1. Paste an English job description
2. Language is detected as "English"
3. Change dropdown to "French"
4. Click "Yes" to translate
5. Description is now in French
6. Generate cover letter in French

### Example 3: No Translation Needed
1. Scrape an English job posting
2. Language is detected as "English"
3. Keep language as "English"
4. No translation prompt appears
5. Generate cover letter in English

## API Endpoint

### POST /api/translate

Translates text from one language to another.

**Request:**
```json
{
  "text": "Job description text...",
  "sourceLanguage": "en",
  "targetLanguage": "de"
}
```

**Response:**
```json
{
  "translatedText": "Translated text...",
  "sourceLanguage": "en",
  "targetLanguage": "de"
}
```

## Supported Languages

- 🇬🇧 English (en)
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇳🇱 Dutch (nl)
- 🇵🇱 Polish (pl)

## Cost

Translation uses OpenAI GPT-4o-mini:
- **Cost:** ~$0.0005 per translation
- **Very affordable** for personal use
- Typical job description: 200-500 words

## User Experience

### Visual Indicators
- **"Detected: [Language]"** - Shows auto-detected language
- **"Translating..."** - Shows during translation
- **Disabled dropdown** - Prevents changes during translation
- **Confirmation dialog** - Prevents accidental translations

### Error Handling
If translation fails:
- User sees an error message
- Language field is still updated
- User can manually edit the description
- App remains functional

## Technical Details

### Translation Quality
- Uses OpenAI GPT-4o-mini for high-quality translations
- Maintains context and technical terminology
- Professional business language
- Preserves formatting

### Performance
- Translation takes 2-5 seconds
- Non-blocking UI (shows loading indicator)
- Graceful error handling
- Fallback to manual editing

### Data Flow
1. User changes language dropdown
2. App checks if description exists
3. Shows confirmation dialog
4. Sends request to `/api/translate`
5. OpenAI translates the text
6. Updates description with translated text
7. User can now generate cover letter in new language

## Best Practices

### When to Translate
✅ **Do translate when:**
- You want to apply to a job in a different language
- You want to practice in another language
- The job posting is in a language you don't speak well

❌ **Don't translate when:**
- The original language is already correct
- You want to keep the original wording
- You're just browsing/testing

### Tips
1. **Review translations** - AI is good but not perfect
2. **Edit if needed** - You can manually adjust after translation
3. **Keep originals** - Consider saving both versions
4. **Test first** - Try with a sample job posting

## Troubleshooting

### "Translation failed"
- Check your internet connection
- Verify OpenAI API key is configured
- Check OpenAI account has credits
- Try again in a few seconds

### Translation seems wrong
- AI translations are generally accurate but not perfect
- Manually edit the description as needed
- Technical terms might need adjustment
- Consider the context of your industry

### Dropdown is disabled
- Translation is in progress
- Wait for "Translating..." to disappear
- Usually takes 2-5 seconds

## Future Enhancements

Potential improvements:
- [ ] Translate requirements array
- [ ] Translate job title and company name
- [ ] Save both original and translated versions
- [ ] Batch translate multiple jobs
- [ ] Custom translation glossary
- [ ] Translation history/undo

## Examples

### Before Translation (German)
```
Wir suchen einen erfahrenen Softwareentwickler für unser Team...
```

### After Translation (English)
```
We are looking for an experienced software developer for our team...
```

## Summary

The translation feature:
- ✅ Automatically detects language
- ✅ Translates on-demand
- ✅ High-quality AI translation
- ✅ User-friendly with confirmations
- ✅ Very affordable (~$0.0005 per translation)
- ✅ Supports 8+ languages
- ✅ Graceful error handling

**Perfect for applying to international jobs!** 🌍
