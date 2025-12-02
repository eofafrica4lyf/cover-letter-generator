// Core data model types

export type PositionType = 
  | 'full-time' 
  | 'part-time' 
  | 'internship' 
  | 'praktikum' 
  | 'co-op' 
  | 'apprenticeship';

export type InputMethod = 
  | 'url' 
  | 'manual' 
  | 'paste' 
  | 'file-upload';

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  graduationDate: string;
  gpa?: string;
  relevantCoursework?: string[];
}

export interface AcademicContext {
  currentDegree: string;
  university: string;
  expectedGraduation: string;
  yearOfStudy: string;
  relevantCoursework: string[];
  gpa?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  academicContext?: AcademicContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPosting {
  id: string;
  jobTitle: string;
  companyName: string;
  positionType: PositionType;
  description: string;
  requirements: string[];
  language: string;
  url?: string;
  inputMethod: InputMethod;
  createdAt: Date;
}

export interface CoverLetter {
  id: string;
  jobPostingId: string;
  content: string;
  originalContent: string;
  language: string;
  metadata: {
    jobTitle: string;
    companyName: string;
    positionType: PositionType;
    generatedAt: Date;
    editedAt?: Date;
  };
}

export interface GenerationRequest {
  jobPosting: JobPosting;
  userProfile: UserProfile;
  language?: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
  additionalNotes?: string;
  additionalInfo?: Record<string, string>;
}

export interface InformationGap {
  id: string;
  question: string;
  category: 'required' | 'recommended' | 'optional';
  context: string;
  suggestedAnswer?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  SCRAPING_FAILED: 'SCRAPING_FAILED',
  PARSING_FAILED: 'PARSING_FAILED',
  FILE_EXTRACTION_FAILED: 'FILE_EXTRACTION_FAILED',
  LANGUAGE_DETECTION_FAILED: 'LANGUAGE_DETECTION_FAILED',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',
  GAP_ANALYSIS_FAILED: 'GAP_ANALYSIS_FAILED',
  REQUIRED_INFO_MISSING: 'REQUIRED_INFO_MISSING',
} as const;
