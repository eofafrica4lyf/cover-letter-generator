import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { runPipeline } from './generatePipeline.js';

/** Vercel Hobby caps at 10s; Pro allows up to 300s. Use 10 so deploy works on Hobby. */
export const config = {
  maxDuration: 10,
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jobPosting, userProfile, language, tone, additionalNotes, additionalInfo, sampleLetter } = req.body || {};

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

    const lang = language || jobPosting.language || 'en';
    const toneVal = tone || 'professional';

    try {
      const result = await runPipeline({
      jobPosting,
      userProfile,
      language: lang,
      tone: toneVal,
      additionalNotes,
      additionalInfo,
      sampleLetter
    });

    return res.status(200).json({
      content: result.content,
      language: result.language,
      tokensUsed: result.content.split(' ').length
    });
  } catch (pipelineError) {
    console.warn('Pipeline failed, falling back to legacy generator:', pipelineError);
    try {
      const content = await generateCoverLetter({
        jobPosting,
        userProfile,
        language: lang,
        tone: toneVal,
        additionalNotes,
        additionalInfo,
        sampleLetter
      });
      return res.status(200).json({
        content,
        language: lang,
        tokensUsed: content.split(' ').length
      });
    } catch (error) {
      console.error('Generation error:', error);
      return res.status(500).json({
        error: 'Failed to generate cover letter',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  } catch (err) {
    console.error('Generate API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    try {
      return res.status(500).json({
        error: 'A server error occurred',
        details: message,
        code: 'FUNCTION_ERROR'
      });
    } catch (_) {
      // Response already sent; do not throw
    }
  }
}

async function generateCoverLetter(params: any): Promise<string> {
  const { jobPosting, userProfile, language, tone, additionalNotes, additionalInfo, sampleLetter } = params;

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
          content: `You are an expert cover letter writer. Create concise, professional, one-page personalized cover letters that:
- Highlight relevant experience and skills matching the job requirements
- Use a ${tone} tone
- Are concise (300-400 words for the body)
- Follow proper business letter format
- ${languageInstructions}
- Emphasize achievements and specific examples
- Show genuine interest in the company and role
- ${isEducational ? 'Focus on academic achievements, coursework, and eagerness to learn' : 'Focus on professional experience and proven results'}
- Speak in an active voice, not passive voice
- Ensure the introduction flows naturally into the body paragraphs

${sampleLetter ? `CRITICAL: A sample letter will be provided. You MUST:
1. Carefully analyze its writing style, sentence structure, and tone
2. Mirror its paragraph organization and flow
3. Match its level of formality and word choice
4. Replicate its approach to presenting qualifications
5. Use similar transition phrases and connecting language
6. Maintain the same voice and personality throughoutone-page 
7. Keep similar paragraph lengths and pacing

BODY PARAGRAPH REQUIREMENTS:
- Write EXACTLY 2 paragraphs for the body
- Prioritize skills in this order: hard/technical skills → soft skills → language skills
- For each skill, find the 1-2 most relevant experiences from work experience and projects
- Each paragraph should be 2-3 sentences maximum
- Only mention skills that are directly demonstrated by the experiences you cite
- The entire letter must fit on one page
The sample is your PRIMARY style guide - follow it closely while adapting content to the new job.` : `For the introduction, write an attention-grabbing hook that naturally leads into your qualifications. Speak in an active and direct voice, not passive and indirect.

For the body, write EXACTLY 2 paragraphs following this process:

MANDATORY SKILL PRIORITIZATION ORDER:
1. **HIGHEST PRIORITY**: Programming languages in the EXACT order they appear in job requirements
   - If job lists "C/C++, Python, Java" → Start with C/C++ first, then Python, then Java
   - If job lists "Python, JavaScript, C++" → Start with Python first, then JavaScript, then C++
2. **SECOND PRIORITY**: Frameworks and tools (React, Node.js, Docker, etc.)
3. **THIRD PRIORITY**: Soft skills (leadership, communication, problem-solving)
4. **FOURTH PRIORITY**: Language skills (if space allows)

PARAGRAPH CONSTRUCTION PROCESS - FOLLOW EXACTLY:
1. Look at the job requirements list and identify the #1 MOST IMPORTANT technical skill mentioned first
2. FIRST PARAGRAPH: Write about the highest priority technical skill you can prove with evidence
3. SECOND PARAGRAPH: Write about the next highest priority skills you can prove
4. NEVER write about lower priority skills before higher priority skills
5. If you cannot prove the #1 skill, move to #2, but maintain the priority order throughout

STRICT MATCHING RULES:
- NEVER use an experience to explain a skill unless that experience EXPLICITLY mentions or demonstrates that exact skill
- If a work experience description doesn't mention a specific technology/skill, DO NOT use it to claim expertise in that technology/skill
- If an experience uses React.js, only mention React.js - not "programming" or "C++"
- If an experience mentions "project management" but not "Python", DO NOT use it to claim Python skills
- Only pick experiences where the description directly contains evidence of the skill you're writing about
- If no experience directly demonstrates a required skill, skip that skill entirely rather than stretching the truth

CRITICAL PARAGRAPH COHERENCE RULES - FOLLOW THESE EXACTLY:

1. NEVER claim experience in a skill/technology unless the candidate's profile explicitly shows work with that EXACT skill/technology
2. The opening sentence MUST ONLY mention skills that are DIRECTLY demonstrated in the examples that follow in the SAME paragraph
3. DO NOT try to "stretch" or "infer" skills - if the candidate worked with React.js, say "React.js", NOT "C programming"
4. Each paragraph structure MUST be: 
   - Topic sentence mentioning ONLY skills proven in this paragraph
   - Evidence from experience using those EXACT skills
   - Achievement/result from that experience

CORRECT Example:
"I have 4 years of experience in digital marketing, owning social media, email, and web content strategies. At ABC Company, I successfully generated a 32% increase in web traffic through my dynamic social media strategy and at XYZ Company, I exceeded the industry standard email open rate at 51%."
✓ Opens with "digital marketing" → Examples are about digital marketing → Achievement in digital marketing

INCORRECT Example #1:
"I have substantial experience in C and embedded programming, having led projects that involve significant code development. At Altexsoft, I developed client products using React.js that led to a 30% increase in user engagement."
✗ Opens with "C and embedded" → Examples are about React.js → These are COMPLETELY DIFFERENT technologies!

INCORRECT Example #2:
"My proficiency in German enables me to collaborate in multilingual teams. At Company X, I improved data tracking accuracy by 40%."
✗ Opens with "German language" → Example is about data tracking → No connection to language skills!

THE FIX: Only mention skills in the topic sentence that you can PROVE with specific examples in that paragraph. If the candidate doesn't have C/embedded experience in their profile, DO NOT claim it - instead, focus on the skills they actually have (like React.js, Node.js, etc.) and explain how those transferable skills apply to the role.`}

Format the letter with:
1. Contact information header (your name, email, phone, address)
2. Recipient block: if a hiring manager is provided, put them FIRST (e.g. "Attn: [Name]" in English, or "z.Hd. Herrn/Frau [Name]" in German), then company name with address under it.
3. Title
4. Greeting/Introduction (should preview the main qualifications discussed in body)
5. Body paragraphs (EXACTLY 2 paragraphs with smooth transitions)
6. Closing (should tie back to introduction)
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

${sampleLetter ? `
═══════════════════════════════════════════════════════
SAMPLE LETTER - YOUR PRIMARY STYLE REFERENCE
═══════════════════════════════════════════════════════

${sampleLetter}

═══════════════════════════════════════════════════════

INSTRUCTIONS:
1. Study the sample letter carefully - note its tone, sentence structure, paragraph flow, and transitions
2. Replicate its writing style exactly while changing the content to match the job posting above
3. If the sample uses specific phrases or patterns (e.g., "I have X years of experience in..."), use similar patterns
4. Match the sample's level of enthusiasm, formality, and personality
5. Keep similar paragraph lengths and structure
6. Ensure your introduction connects to the body just like the sample does
7. Use the same approach to presenting achievements (numbers, specific examples, etc.)

Your goal: Write a letter that FEELS like it was written by the same person who wrote the sample, but for this new job.

` : ''}${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}

` : ''}${additionalInfo && Object.keys(additionalInfo).length > 0 ? `ADDITIONAL CONTEXT:
${Object.entries(additionalInfo).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

` : ''}🔴 CRITICAL INSTRUCTION - READ FIRST 🔴
You are FORBIDDEN from claiming skills that are not explicitly mentioned in the candidate's work experience or project descriptions. 

BEFORE writing about ANY skill:
1. Quote the exact text from the candidate's profile that mentions that skill
2. If you cannot find an exact mention, DO NOT write about that skill
3. It is better to write about fewer skills honestly than to make false claims

Generate a compelling cover letter that demonstrates why this candidate is an excellent fit for this position USING ONLY SKILLS THAT ARE EXPLICITLY DOCUMENTED IN THEIR PROFILE.

🚨 MANDATORY PRE-WRITING VERIFICATION 🚨
Before writing ANYTHING about a skill, you MUST:

1. Find the EXACT work experience or project you want to reference
2. Read the description word-for-word 
3. Verify the skill/technology is EXPLICITLY mentioned in that description
4. If the skill is NOT mentioned in the description, DO NOT write about it

EXAMPLES OF WHAT NOT TO DO:
❌ Job requires "C++" → Altexsoft experience mentions "React.js" → DO NOT claim C++ experience from Altexsoft
❌ Job requires "Python" → Project mentions "firmware" but not "Python" → DO NOT claim Python experience from that project
❌ Job requires "leadership" → Experience says "developed products" → DO NOT claim leadership experience

ONLY WRITE ABOUT SKILLS THAT ARE WORD-FOR-WORD IN THE EXPERIENCE DESCRIPTIONS.

🚫 ABSOLUTE PROHIBITIONS - ZERO TOLERANCE 🚫

YOU ARE COMPLETELY FORBIDDEN FROM:
- Writing about lower priority skills before higher priority skills (e.g., Python before C++ if C++ is listed first in job requirements)
- Writing "I honed my proficiency in C and C++" if the experience description doesn't mention C or C++
- Writing "my work with Python" if the project description doesn't mention Python  
- Writing "leadership experience" if the description doesn't mention leading people
- Writing "embedded software development" if the experience doesn't mention embedded systems
- Making ANY connection between an experience and a skill unless that skill is explicitly written in the experience description

MANDATORY PROCESS:
1. Look at job requirement (e.g., "C++ programming")
2. Search candidate's profile for experiences that mention "C++" 
3. If NO experience mentions "C++", skip C++ entirely
4. Only write about skills that are literally written in the experience descriptions
5. Use the exact words from the profile, don't paraphrase or infer

VIOLATION EXAMPLES TO NEVER REPEAT:
❌ Writing about Python first when C/C++ is the #1 priority in job requirements
❌ "During my tenure as a Full-stack Software Engineer at Altexsoft, I honed my proficiency in C and C++" (if Altexsoft description doesn't mention C/C++)
❌ "my work with Python in various projects, such as the Firmware OTA Update Script" (if that project description doesn't mention Python)

✅ CORRECT ORDERING: If job requirements list "C/C++, Python, Java":
- First paragraph: C/C++ skills (if you can prove them)
- Second paragraph: Python skills (if you can prove them)
- Never put Python before C/C++

✅ CORRECT: Only mention skills that are word-for-word in the experience descriptions${sampleLetter ? '\n- Match the sample letter\'s style closely!' : ''}`
        }
      ],
      temperature: 0.1,
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
      const endDate = exp.isOngoing ? 'Present (Ongoing)' : (exp.endDate || 'Present');
      context += `\n${idx + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${endDate})
   ${exp.description}`;
    });
  }

  if (userProfile.education && userProfile.education.length > 0) {
    context += '\n\nEDUCATION:';
    userProfile.education.forEach((edu: any, idx: number) => {
      const status = edu.isOngoing ? ' (In Progress)' : '';
      context += `\n${idx + 1}. ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.graduationDate})${status}`;
    });
  }

  if (userProfile.projects && userProfile.projects.length > 0) {
    context += '\n\nPROJECTS:';
    userProfile.projects.forEach((proj: any, idx: number) => {
      const status = proj.isOngoing ? 'Ongoing' : 'Completed';
      const completionDate = proj.completionDate ? new Date(proj.completionDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Date not specified';
      context += `\n${idx + 1}. ${proj.title} (${status}: ${completionDate})`;
      context += `\n   ${proj.description}`;
    });
  }

  return context;
}

function buildJobContext(jobPosting: any): string {
  let context = `Company: ${jobPosting.companyName}
Position: ${jobPosting.jobTitle}
Type: ${jobPosting.positionType}
Language: ${jobPosting.language}`;

  // Add additional job details if available
  if (jobPosting.hiringManager) {
    context += `\nHiring Manager: ${jobPosting.hiringManager}`;
  }
  
  if (jobPosting.department) {
    context += `\nDepartment: ${jobPosting.department}`;
  }
  
  if (jobPosting.companyAddress) {
    context += `\nCompany Address: ${jobPosting.companyAddress}`;
  }
  
  if (jobPosting.salary) {
    context += `\nSalary: ${jobPosting.salary}`;
  }
  
  if (jobPosting.applicationDeadline) {
    context += `\nApplication Deadline: ${jobPosting.applicationDeadline}`;
  }

  context += `\n\nDESCRIPTION:
${jobPosting.description}`;

  if (jobPosting.requirements && jobPosting.requirements.length > 0) {
    context += `\n\nKEY REQUIREMENTS:
${jobPosting.requirements.map((req: string, idx: number) => `${idx + 1}. ${req}`).join('\n')}`;
  }
  
  if (jobPosting.benefits && jobPosting.benefits.length > 0) {
    context += `\n\nBENEFITS:
${jobPosting.benefits.map((benefit: string, idx: number) => `${idx + 1}. ${benefit}`).join('\n')}`;
  }

  return context;
}

function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: 'Write in English',
    de: 'Write in German (Deutsch). Use formal business German. Do not repeat your name, address, or phone at the bottom—only your name under the signature.',
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
