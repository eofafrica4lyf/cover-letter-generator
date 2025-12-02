import Dexie from 'dexie';
import type { UserProfile, CoverLetter, JobPosting } from '../types';

export class CoverLetterDatabase extends Dexie {
  profiles!: Dexie.Table<UserProfile, string>;
  coverLetters!: Dexie.Table<CoverLetter, string>;
  jobPostings!: Dexie.Table<JobPosting, string>;
  settings!: Dexie.Table<{ key: string; value: any }, string>;

  constructor() {
    super('CoverLetterGeneratorDB');
    
    this.version(1).stores({
      profiles: 'id',
      coverLetters: 'id, jobPostingId, metadata.companyName, metadata.jobTitle, metadata.generatedAt, metadata.positionType',
      jobPostings: 'id, companyName, createdAt',
      settings: 'key'
    });
  }
}

export const db = new CoverLetterDatabase();
