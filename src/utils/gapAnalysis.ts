import type { JobPosting, UserProfile, InformationGap } from '../types';

export function analyzeInformationGaps(
  jobPosting: JobPosting,
  userProfile: UserProfile
): InformationGap[] {
  const gaps: InformationGap[] = [];

  // Check required profile fields
  if (!userProfile.email || !userProfile.email.includes('@')) {
    gaps.push({
      id: 'email',
      question: 'What is your email address?',
      category: 'required',
      context: 'Email is required for the cover letter header',
      suggestedAnswer: userProfile.email || ''
    });
  }

  if (!userProfile.phone) {
    gaps.push({
      id: 'phone',
      question: 'What is your phone number?',
      category: 'required',
      context: 'Phone number is required for the cover letter header',
      suggestedAnswer: ''
    });
  }

  if (!userProfile.location) {
    gaps.push({
      id: 'location',
      question: 'What is your location (city, country)?',
      category: 'recommended',
      context: 'Location helps personalize your cover letter',
      suggestedAnswer: ''
    });
  }

  // Check for relevant experience based on position type
  const isEducational = ['internship', 'praktikum', 'co-op', 'apprenticeship'].includes(
    jobPosting.positionType
  );

  if (isEducational) {
    // Check for academic context
    if (!userProfile.academicContext) {
      gaps.push({
        id: 'academic-context',
        question: 'What degree program are you currently pursuing?',
        category: 'recommended',
        context: 'Academic information is important for educational positions',
        suggestedAnswer: ''
      });
    } else {
      if (!userProfile.academicContext.university) {
        gaps.push({
          id: 'university',
          question: 'Which university do you attend?',
          category: 'recommended',
          context: 'University name strengthens your application',
          suggestedAnswer: ''
        });
      }
      if (!userProfile.academicContext.expectedGraduation) {
        gaps.push({
          id: 'graduation',
          question: 'When is your expected graduation date?',
          category: 'optional',
          context: 'Graduation date helps employers plan',
          suggestedAnswer: ''
        });
      }
    }
  } else {
    // Check for work experience
    if (!userProfile.workExperience || userProfile.workExperience.length === 0) {
      gaps.push({
        id: 'work-experience',
        question: 'Do you have any relevant work experience for this position?',
        category: 'recommended',
        context: 'Work experience is important for professional positions',
        suggestedAnswer: ''
      });
    }
  }

  // Check for skills match
  if (!userProfile.skills || userProfile.skills.length === 0) {
    gaps.push({
      id: 'skills',
      question: 'What skills do you have that are relevant to this position?',
      category: 'recommended',
      context: 'Skills help match you to the job requirements',
      suggestedAnswer: jobPosting.requirements.slice(0, 3).join(', ')
    });
  } else {
    // Check if any skills match job requirements
    const matchingSkills = userProfile.skills.filter(skill =>
      jobPosting.requirements.some(req =>
        req.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(req.toLowerCase())
      )
    );

    if (matchingSkills.length === 0 && jobPosting.requirements.length > 0) {
      gaps.push({
        id: 'relevant-skills',
        question: `Do you have experience with: ${jobPosting.requirements.slice(0, 3).join(', ')}?`,
        category: 'optional',
        context: 'Adding relevant skills strengthens your application',
        suggestedAnswer: ''
      });
    }
  }

  // Check education
  if (!userProfile.education || userProfile.education.length === 0) {
    gaps.push({
      id: 'education',
      question: 'What is your educational background?',
      category: 'recommended',
      context: 'Education information is typically expected in cover letters',
      suggestedAnswer: ''
    });
  }

  return gaps;
}

export function canProceedWithGeneration(gaps: InformationGap[]): boolean {
  // Can only proceed if there are no required gaps
  return !gaps.some(gap => gap.category === 'required');
}
