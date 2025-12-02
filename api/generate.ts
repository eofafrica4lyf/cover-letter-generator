import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobPosting, userProfile, language, tone, additionalNotes, additionalInfo } = req.body;

  if (!jobPosting || !userProfile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: 'OpenAI API key not configured',
      message: 'Please add OPENAI_API_KEY to your environment variables'
    });
  }

  try {
    const content = await generateCoverLetter({
      jobPosting,
      userProfile,
      language: language || jobPosting.language || 'en',
      tone: tone || 'professional',
      additionalNotes,
      additionalInfo
    });

    return res.status(200).json({
      content,
      language: language || jobPosting.language || 'en',
      tokensUsed: content.split(' ').length // Approximate token count
    });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate cover letter',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateCoverLetter(params: any): Promise<string> {
  const { jobPosting, userProfile, language, tone, additionalNotes, additionalInfo } = params;

  const isEducational = ['internship', 'praktikum', 'co-op', 'apprenticeship'].includes(
    jobPosting.positionType
  );

  // Build context about the user
  const userContext = buildUserContext(userProfile, isEducational);
  const jobContext = buildJobContext(jobPosting);

  // Language-specific instructions
  const languageInstructions = getLanguageInstructions(language);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert cover letter writer. Create professional, personalized cover letters that:
- Highlight relevant experience and skills matching the job requirements
- Use a ${tone} tone
- Are concise (300-400 words for the body)
- Follow proper business letter format
- ${languageInstructions}
- Emphasize achievements and specific examples
- Show genuine interest in the company and role
- ${isEducational ? 'Focus on academic achievements, coursework, and eagerness to learn' : 'Focus on professional experience and proven results'}

Format the letter with:
1. Contact information header
2. Date
3. Company name
4. Greeting
5. Body paragraphs (3-4 paragraphs)
6. Closing
7. Signature

Do NOT use placeholder text. Use the actual information provided.`
        },
        {
          role: 'user',
          content: `Create a cover letter for this job application:

JOB POSTING:
${jobContext}

CANDIDATE PROFILE:
${userContext}

${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ''}
${additionalInfo ? `ADDITIONAL CONTEXT: ${additionalInfo}` : ''}

Generate a compelling cover letter that demonstrates why this candidate is an excellent fit for this position.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0].message.content || generateFallbackLetter(params);
  } catch (error) {
    console.error('OpenAI generation error:', error);
    // Fallback to template if AI fails
    return generateFallbackLetter(params);
  }
}

function buildUserContext(userProfile: any, isEducational: boolean): string {
  let context = `Name: ${userProfile.name}
Email: ${userProfile.email}
Phone: ${userProfile.phone}
Location: ${userProfile.location}
`;

  if (userProfile.skills && userProfile.skills.length > 0) {
    context += `\nSkills: ${userProfile.skills.join(', ')}`;
  }

  if (isEducational && userProfile.academicContext) {
    const ac = userProfile.academicContext;
    context += `\n\nACADEMIC BACKGROUND:
University: ${ac.university}
Degree: ${ac.currentDegree}
Field of Study: ${ac.fieldOfStudy}
Expected Graduation: ${ac.expectedGraduation}
GPA: ${ac.gpa || 'N/A'}`;
    
    if (ac.relevantCoursework && ac.relevantCoursework.length > 0) {
      context += `\nRelevant Coursework: ${ac.relevantCoursework.join(', ')}`;
    }
    
    if (ac.academicAchievements && ac.academicAchievements.length > 0) {
      context += `\nAchievements: ${ac.academicAchievements.join(', ')}`;
    }
  }

  if (userProfile.workExperience && userProfile.workExperience.length > 0) {
    context += '\n\nWORK EXPERIENCE:';
    userProfile.workExperience.forEach((exp: any, idx: number) => {
      context += `\n${idx + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
   ${exp.description}`;
    });
  }

  if (userProfile.education && userProfile.education.length > 0) {
    context += '\n\nEDUCATION:';
    userProfile.education.forEach((edu: any, idx: number) => {
      context += `\n${idx + 1}. ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.graduationYear})`;
    });
  }

  if (userProfile.projects && userProfile.projects.length > 0) {
    context += '\n\nPROJECTS:';
    userProfile.projects.forEach((proj: any, idx: number) => {
      const completionDate = proj.completionDate ? new Date(proj.completionDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Date not specified';
      context += `\n${idx + 1}. ${proj.title} (Completed: ${completionDate})`;
      context += `\n   ${proj.description}`;
    });
  }

  return context;
}

function buildJobContext(jobPosting: any): string {
  let context = `Company: ${jobPosting.companyName}
Position: ${jobPosting.jobTitle}
Type: ${jobPosting.positionType}
Language: ${jobPosting.language}

DESCRIPTION:
${jobPosting.description}`;

  if (jobPosting.requirements && jobPosting.requirements.length > 0) {
    context += `\n\nKEY REQUIREMENTS:
${jobPosting.requirements.map((req: string, idx: number) => `${idx + 1}. ${req}`).join('\n')}`;
  }

  return context;
}

function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: 'Write in English',
    de: 'Write in German (Deutsch). Use formal business German.',
    fr: 'Write in French (Français). Use formal business French.',
    es: 'Write in Spanish (Español). Use formal business Spanish.',
    it: 'Write in Italian (Italiano). Use formal business Italian.',
    pt: 'Write in Portuguese (Português). Use formal business Portuguese.',
    nl: 'Write in Dutch (Nederlands). Use formal business Dutch.',
    pl: 'Write in Polish (Polski). Use formal business Polish.',
  };

  return instructions[language] || instructions.en;
}

function generateFallbackLetter(params: any): string {
  const { jobPosting, userProfile, language } = params;
  
  const isEducational = ['internship', 'praktikum', 'co-op', 'apprenticeship'].includes(
    jobPosting.positionType
  );

  return `${userProfile.name}
${userProfile.email} | ${userProfile.phone}
${userProfile.location}

${new Date().toLocaleDateString()}

${jobPosting.companyName}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobPosting.jobTitle} position at ${jobPosting.companyName}. ${
    isEducational
      ? `As a ${userProfile.academicContext?.currentDegree || 'student'} at ${userProfile.academicContext?.university || 'university'}, I am eager to apply my academic knowledge and skills to this ${jobPosting.positionType} opportunity.`
      : `With my background in ${userProfile.workExperience?.[0]?.title || 'the field'}, I am confident that I would be a valuable addition to your team.`
  }

${
  isEducational
    ? `Throughout my academic career, I have developed strong skills in ${userProfile.skills?.slice(0, 3).join(', ')}. My coursework in ${userProfile.academicContext?.relevantCoursework?.slice(0, 2).join(' and ')} has prepared me well for the challenges of this role.`
    : `In my previous role as ${userProfile.workExperience?.[0]?.title} at ${userProfile.workExperience?.[0]?.company}, I successfully ${userProfile.workExperience?.[0]?.description}. My expertise in ${userProfile.skills?.slice(0, 3).join(', ')} aligns well with the requirements for this position.`
}

I am particularly drawn to ${jobPosting.companyName} because of your commitment to ${jobPosting.requirements?.[0] || 'excellence'}. I am excited about the opportunity to contribute to your team and grow professionally in this role.

Thank you for considering my application. I look forward to the opportunity to discuss how my ${isEducational ? 'academic background and enthusiasm' : 'experience and skills'} can contribute to ${jobPosting.companyName}'s success.

Sincerely,
${userProfile.name}`;
}
