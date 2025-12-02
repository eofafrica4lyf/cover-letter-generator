import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLanguage, sourceLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Missing required fields: text and targetLanguage' });
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: 'OpenAI API key not configured',
      message: 'Please add OPENAI_API_KEY to your environment variables'
    });
  }

  try {
    const translatedText = await translateText(text, targetLanguage, sourceLanguage);
    
    return res.status(200).json({
      translatedText,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Failed to translate text',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function translateText(
  text: string, 
  targetLanguage: string, 
  sourceLanguage?: string
): Promise<string> {
  const languageNames: Record<string, string> = {
    en: 'English',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
    nl: 'Dutch',
    pl: 'Polish',
  };

  const targetLangName = languageNames[targetLanguage] || targetLanguage;
  const sourceLangName = sourceLanguage ? languageNames[sourceLanguage] || sourceLanguage : 'the source language';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}.
Maintain the original meaning, tone, and formatting. 
For job descriptions, preserve technical terms and industry-specific language appropriately.
Return ONLY the translated text, nothing else.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content || text;
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
