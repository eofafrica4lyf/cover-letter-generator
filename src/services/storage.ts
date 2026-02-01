import { db } from '../db/database';
import type { UserProfile, CoverLetter, JobPosting } from '../types';
import { ErrorCodes } from '../types';
import { firestoreService, type FirestoreDocument } from './firestoreService';
import { auth } from '../lib/firebase';
import { orderBy as firestoreOrderBy } from 'firebase/firestore';

// Helper to get current user ID
function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user.uid;
}

// Helper to remove undefined values (Firestore doesn't allow them)
function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

// Profile Storage Service
export class ProfileStorage {
  static async create(profile: UserProfile): Promise<void> {
    try {
      const userId = getCurrentUserId();
      // Remove undefined values before saving to Firestore
      const cleanProfile = removeUndefined(profile);
      await firestoreService.create<UserProfile & FirestoreDocument>(
        'profiles',
        userId,
        profile.id,
        cleanProfile
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(): Promise<UserProfile | null> {
    try {
      const userId = getCurrentUserId();
      const profiles = await firestoreService.list<UserProfile & FirestoreDocument>(
        'profiles',
        userId
      );
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      // Fallback to Dexie if Firestore fails
      console.warn('Firestore read failed, falling back to Dexie:', error);
      const profiles = await db.profiles.toArray();
      return profiles.length > 0 ? profiles[0] : null;
    }
  }

  static async update(profile: UserProfile): Promise<void> {
    profile.updatedAt = new Date();
    await this.create(profile);
  }

  static async delete(id: string): Promise<void> {
    const userId = getCurrentUserId();
    await firestoreService.delete('profiles', userId, id);
  }
}

// Cover Letter Storage Service
export class CoverLetterStorage {
  static async create(letter: CoverLetter): Promise<void> {
    try {
      const userId = getCurrentUserId();
      // Remove undefined values before saving to Firestore
      const cleanLetter = removeUndefined(letter);
      await firestoreService.create<CoverLetter & FirestoreDocument>(
        'coverLetters',
        userId,
        letter.id,
        cleanLetter
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(id: string): Promise<CoverLetter | undefined> {
    try {
      const userId = getCurrentUserId();
      const letter = await firestoreService.read<CoverLetter & FirestoreDocument>(
        'coverLetters',
        userId,
        id
      );
      return letter || undefined;
    } catch (error) {
      console.warn('Firestore read failed, falling back to Dexie:', error);
      return await db.coverLetters.get(id);
    }
  }

  static async update(id: string, updates: Partial<CoverLetter>): Promise<void> {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error('Cover letter not found');
    }
    
    const updated = { ...updates };
    if (updates.content && updates.content !== existing.originalContent) {
      updated.metadata = {
        ...existing.metadata,
        ...updates.metadata,
        editedAt: new Date(),
      };
    }
    
    const userId = getCurrentUserId();
    await firestoreService.update('coverLetters', userId, id, updated);
  }

  static async delete(id: string): Promise<void> {
    const userId = getCurrentUserId();
    await firestoreService.delete('coverLetters', userId, id);
  }

  static async list(filters?: {
    companyName?: string;
    jobTitle?: string;
    dateRange?: { start: Date; end: Date };
    positionType?: string;
  }): Promise<CoverLetter[]> {
    try {
      const userId = getCurrentUserId();
      
      // Get all letters and filter in memory
      // Firestore queries are limited, so we'll do client-side filtering
      let results = await firestoreService.list<CoverLetter & FirestoreDocument>(
        'coverLetters',
        userId,
        [firestoreOrderBy('createdAt', 'desc')]
      );

      // Apply filters
      if (filters?.companyName) {
        results = results.filter(letter => 
          letter.metadata.companyName === filters.companyName
        );
      }

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

      return results;
    } catch (error) {
      console.warn('Firestore list failed, falling back to Dexie:', error);
      let query = db.coverLetters.toCollection();

      if (filters?.companyName) {
        query = db.coverLetters.where('metadata.companyName').equals(filters.companyName);
      }

      let results = await query.toArray();

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

      return results.sort((a, b) => 
        b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime()
      );
    }
  }
}

// Job Posting Storage Service
export class JobPostingStorage {
  static async create(jobPosting: JobPosting): Promise<void> {
    try {
      const userId = getCurrentUserId();
      // Remove undefined values before saving to Firestore
      const cleanJob = removeUndefined(jobPosting);
      await firestoreService.create<JobPosting & FirestoreDocument>(
        'jobs',
        userId,
        jobPosting.id,
        cleanJob
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      throw error;
    }
  }

  static async read(id: string): Promise<JobPosting | undefined> {
    try {
      const userId = getCurrentUserId();
      const job = await firestoreService.read<JobPosting & FirestoreDocument>(
        'jobs',
        userId,
        id
      );
      return job || undefined;
    } catch (error) {
      console.warn('Firestore read failed, falling back to Dexie:', error);
      return await db.jobPostings.get(id);
    }
  }

  static async update(id: string, updates: Partial<JobPosting>): Promise<void> {
    const userId = getCurrentUserId();
    const cleaned = removeUndefined(updates);
    await firestoreService.update('jobs', userId, id, cleaned);
  }

  static async list(): Promise<JobPosting[]> {
    try {
      const userId = getCurrentUserId();
      return await firestoreService.list<JobPosting & FirestoreDocument>(
        'jobs',
        userId,
        [firestoreOrderBy('createdAt', 'desc')]
      );
    } catch (error) {
      console.warn('Firestore list failed, falling back to Dexie:', error);
      return await db.jobPostings.orderBy('createdAt').reverse().toArray();
    }
  }

  static async delete(id: string): Promise<void> {
    const userId = getCurrentUserId();
    await firestoreService.delete('jobs', userId, id);
  }
}
