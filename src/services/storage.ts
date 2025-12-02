import { db } from '../db/database';
import type { UserProfile, CoverLetter, JobPosting } from '../types';
import { ErrorCodes } from '../types';

// Profile Storage Service
export class ProfileStorage {
  static async create(profile: UserProfile): Promise<void> {
    try {
      await db.profiles.put(profile);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(): Promise<UserProfile | null> {
    const profiles = await db.profiles.toArray();
    return profiles.length > 0 ? profiles[0] : null;
  }

  static async update(profile: UserProfile): Promise<void> {
    profile.updatedAt = new Date();
    await this.create(profile);
  }

  static async delete(id: string): Promise<void> {
    await db.profiles.delete(id);
  }
}

// Cover Letter Storage Service
export class CoverLetterStorage {
  static async create(letter: CoverLetter): Promise<void> {
    try {
      await db.coverLetters.put(letter);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(id: string): Promise<CoverLetter | undefined> {
    return await db.coverLetters.get(id);
  }

  static async update(id: string, updates: Partial<CoverLetter>): Promise<void> {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error('Cover letter not found');
    }
    
    const updated = { ...existing, ...updates };
    if (updates.content && updates.content !== existing.originalContent) {
      updated.metadata.editedAt = new Date();
    }
    
    await db.coverLetters.put(updated);
  }

  static async delete(id: string): Promise<void> {
    await db.coverLetters.delete(id);
  }

  static async list(filters?: {
    companyName?: string;
    jobTitle?: string;
    dateRange?: { start: Date; end: Date };
    positionType?: string;
  }): Promise<CoverLetter[]> {
    let query = db.coverLetters.toCollection();

    if (filters?.companyName) {
      query = db.coverLetters.where('metadata.companyName').equals(filters.companyName);
    }

    let results = await query.toArray();

    // Apply additional filters
    if (filters?.jobTitle) {
      results = results.filter(letter => 
        letter.metadata.jobTitle.toLowerCase().includes(filters.jobTitle!.toLowerCase())
      );
    }

    if (filters?.dateRange) {
      results = results.filter(letter => {
        const date = letter.metadata.generatedAt;
        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
      });
    }

    if (filters?.positionType) {
      results = results.filter(letter => 
        letter.metadata.positionType === filters.positionType
      );
    }

    // Sort by date descending (newest first)
    return results.sort((a, b) => 
      b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime()
    );
  }
}

// Job Posting Storage Service
export class JobPostingStorage {
  static async create(jobPosting: JobPosting): Promise<void> {
    try {
      await db.jobPostings.put(jobPosting);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(id: string): Promise<JobPosting | undefined> {
    return await db.jobPostings.get(id);
  }

  static async list(): Promise<JobPosting[]> {
    return await db.jobPostings.orderBy('createdAt').reverse().toArray();
  }

  static async delete(id: string): Promise<void> {
    await db.jobPostings.delete(id);
  }
}
