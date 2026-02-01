import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source, content, filename } = req.body;

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: 'OpenAI API key not configured',
      message: 'Please add OPENAI_API_KEY to your environment variables'
    });
  }

  try {
    let result;

    switch (source) {
      case 'url':
        result = await parseFromURL(content);
        break;
      case 'text':
        result = await parseFromText(content);
        break;
      case 'file':
        result = await parseFromFile(content, filename);
        break;
      case 'test':
        // Health check endpoint
        return res.status(200).json({ status: 'ok', apiConfigured: !!process.env.OPENAI_API_KEY });
      default:
        return res.status(400).json({ error: 'Invalid source type' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Parse error:', error);
    return res.status(500).json({ 
      error: 'Failed to parse job posting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function parseFromURL(url: string) {
  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style, nav, header, footer').remove();

    // Extract text content
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit to avoid token limits

    // Use OpenAI to parse the content
    return await parseWithAI(textContent, 'url');
  } catch (error) {
    console.error('URL parsing error:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseFromText(text: string) {
  return await parseWithAI(text, 'text');
}

async function parseFromFile(base64Content: string, filename: string) {
  try {
    // Extract text from base64 content
    const base64Data = base64Content.split(',')[1] || base64Content;
    const buffer = Buffer.from(base64Data, 'base64');
    
    let text = '';
    
    if (filename.endsWith('.pdf')) {
      // For PDF parsing, we'll use a simple approach
      // In production, you'd want to use pdf-parse or similar
      text = buffer.toString('utf-8');
    } else if (filename.endsWith('.docx')) {
      // For DOCX, we'd use mammoth
      // For now, simple text extraction
      text = buffer.toString('utf-8');
    } else {
      text = buffer.toString('utf-8');
    }

    return await parseWithAI(text, 'file');
  } catch (error) {
    console.error('File parsing error:', error);
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseWithAI(content: string, source: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an accurate job posting parser. Extract structured information from job postings.
Return a JSON object with these fields:
- jobTitle: string (the job title)
- companyName: string (the company name)
- description: string (full job description). Add everything about the job post. Don't change anything.
- requirements: string[] (array of key requirements/qualifications). Each item must be a short skill label only: one or two words (e.g. "C++", "Python", "React", "team leadership", "German"). No full sentences or long phrases. Extract technical skills, languages, soft skills as nouns or short labels.
- language: string (detected language code: en, de, fr, es, etc.)
- positionType: string (one of: full-time, part-time, internship, praktikum, co-op, apprenticeship)
- hiringManager: string | null (name of hiring manager if mentioned, e.g., "John Smith" or "Dr. Jane Doe"). Looks for anyone tagged as 'Contact'/'Recruiter'
- companyAddress: string | null (company address if mentioned). Search online for the address of the company. If there is particular location, include the location in the search.
- department: string | null (department name if mentioned, e.g., "Engineering", "Marketing")
- salary: string | null (salary range if mentioned, e.g., "$80,000 - $100,000")
- benefits: string[] | null (list of benefits if mentioned)
- applicationDeadline: string | null (application deadline if mentioned)

Extract as much information as possible. If a field is not found, set it to null or empty array.
Be accurate and extract real information from the content.`
        },
        {
          role: 'user',
          content: `Parse this job posting:\n\n${content}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      jobTitle: result.jobTitle || 'Unknown Position',
      companyName: result.companyName || 'Unknown Company',
      description: result.description || content,
      requirements: result.requirements || [],
      language: result.language || 'en',
      positionType: result.positionType || 'full-time',
      hiringManager: result.hiringManager || undefined,
      companyAddress: result.companyAddress || undefined,
      department: result.department || undefined,
      salary: result.salary || undefined,
      benefits: result.benefits || undefined,
      applicationDeadline: result.applicationDeadline || undefined,
      confidence: 0.85,
      source
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
