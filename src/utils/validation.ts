import type { UserProfile, JobPosting, ValidationResult, ValidationError } from '../types';

export function validateProfile(profile: Partial<UserProfile>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name is required
  if (!profile.name || profile.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Email format validation
  if (profile.email && !isValidEmail(profile.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT'
    });
  }

  // Phone format validation (basic)
  if (profile.phone && profile.phone.length < 10) {
    errors.push({
      field: 'phone',
      message: 'Phone number must be at least 10 digits',
      code: 'INVALID_FORMAT'
    });
  }

  // Must have either work experience or academic context
  const hasWorkExperience = profile.workExperience && profile.workExperience.length > 0;
  const hasAcademicContext = profile.academicContext && 
    profile.academicContext.currentDegree && 
    profile.academicContext.university;

  if (!hasWorkExperience && !hasAcademicContext) {
    errors.push({
      field: 'experience',
      message: 'Profile must have either work experience or academic context',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate date ranges for work experience
  if (profile.workExperience) {
    profile.workExperience.forEach((exp, index) => {
      if (exp.endDate && new Date(exp.startDate) > new Date(exp.endDate)) {
        errors.push({
          field: `workExperience[${index}].dates`,
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateJobPosting(jobPosting: Partial<JobPosting>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!jobPosting.jobTitle || jobPosting.jobTitle.trim().length === 0) {
    errors.push({
      field: 'jobTitle',
      message: 'Job title is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!jobPosting.companyName || jobPosting.companyName.trim().length === 0) {
    errors.push({
      field: 'companyName',
      message: 'Company name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!jobPosting.positionType) {
    errors.push({
      field: 'positionType',
      message: 'Position type is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate position type is from allowed values
  const validPositionTypes = ['full-time', 'part-time', 'internship', 'praktikum', 'co-op', 'apprenticeship'];
  if (jobPosting.positionType && !validPositionTypes.includes(jobPosting.positionType)) {
    errors.push({
      field: 'positionType',
      message: 'Invalid position type',
      code: 'INVALID_VALUE'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCoverLetter(content: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!content || content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: 'Cover letter content cannot be empty',
      code: 'REQUIRED_FIELD'
    });
  }

  if (content && content.length < 100) {
    errors.push({
      field: 'content',
      message: 'Cover letter must be at least 100 characters',
      code: 'MIN_LENGTH'
    });
  }

  if (content && content.length > 5000) {
    errors.push({
      field: 'content',
      message: 'Cover letter must not exceed 5000 characters',
      code: 'MAX_LENGTH'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function identifyMissingFields(jobPosting: Partial<JobPosting>): string[] {
  const missing: string[] = [];
  
  if (!jobPosting.jobTitle) missing.push('Job Title');
  if (!jobPosting.companyName) missing.push('Company Name');
  if (!jobPosting.positionType) missing.push('Position Type');
  if (!jobPosting.description) missing.push('Job Description');
  
  return missing;
}
