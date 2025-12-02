import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobPosting, userProfile, language, tone, additionalNotes, additionalInfo } = req.body;

  if (!jobPosting || !userProfile) {
    return res.status(400).json({ error: 'Missing required fields' });
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
      tokensUsed: 0 // TODO: Track actual token usage
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
  const { jobPosting, userProfile, language, tone } = params;

  // TODO: Implement actual OpenAI API call
  // For now, return a template-based cover letter
  
  const isEducational = ['internship', 'praktikum', 'co-op', 'apprenticeship'].includes(
    jobPosting.positionType
  );

  const template = `${userProfile.name}
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

  return template;
}
