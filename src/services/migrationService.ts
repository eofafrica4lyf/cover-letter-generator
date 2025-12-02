import { db as dexieDb } from '../db/database';
import { firestoreService } from './firestoreService';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../lib/firebase';
import type { UserProfile, CoverLetter, JobPosting } from '../types';

export interface MigrationResult {
  success: boolean;
  profilesMigrated: number;
  jobsMigrated: number;
  lettersMigrated: number;
  errors: Error[];
}

interface MigrationStatus {
  userId: string;
  completed: boolean;
  completedAt: Date | null;
  version: number;
}

const MIGRATION_VERSION = 1;

class MigrationService {
  /**
   * Remove undefined values from an object recursively
   * Firestore doesn't allow undefined values
   */
  private removeUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefined(value);
        }
      }
      return cleaned as T;
    }

    return obj;
  }

  /**
   * Check if migration is needed for a user
   */
  async needsMigration(userId: string): Promise<boolean> {
    try {
      // Check if migration status exists in Firestore
      const statusDoc = await getDoc(
        doc(firestoreDb, 'users', userId, 'metadata', 'migration')
      );

      if (statusDoc.exists()) {
        const status = statusDoc.data() as MigrationStatus;
        return !status.completed || status.version < MIGRATION_VERSION;
      }

      // Check if there's any data in Dexie
      const profiles = await dexieDb.profiles.count();
      const jobs = await dexieDb.jobPostings.count();
      const letters = await dexieDb.coverLetters.count();

      return profiles > 0 || jobs > 0 || letters > 0;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Perform migration from Dexie to Firestore
   */
  async migrate(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      profilesMigrated: 0,
      jobsMigrated: 0,
      lettersMigrated: 0,
      errors: [],
    };

    try {
      // Check if already migrated
      const alreadyMigrated = await this.isMigrationComplete(userId);
      if (alreadyMigrated) {
        result.success = true;
        return result;
      }

      // Migrate profiles
      try {
        const profiles = await dexieDb.profiles.toArray();
        for (const profile of profiles) {
          // Remove undefined values before sending to Firestore
          const cleanProfile = this.removeUndefined(profile);
          await firestoreService.create<UserProfile & { userId: string; createdAt: Date; updatedAt: Date }>(
            'profiles',
            userId,
            profile.id,
            cleanProfile
          );
          result.profilesMigrated++;
        }
      } catch (error) {
        result.errors.push(new Error(`Profile migration failed: ${error}`));
      }

      // Migrate job postings
      try {
        const jobs = await dexieDb.jobPostings.toArray();
        for (const job of jobs) {
          // Remove undefined values before sending to Firestore
          const cleanJob = this.removeUndefined(job);
          await firestoreService.create<JobPosting & { userId: string; createdAt: Date; updatedAt: Date }>(
            'jobs',
            userId,
            job.id,
            cleanJob
          );
          result.jobsMigrated++;
        }
      } catch (error) {
        result.errors.push(new Error(`Job migration failed: ${error}`));
      }

      // Migrate cover letters
      try {
        const letters = await dexieDb.coverLetters.toArray();
        for (const letter of letters) {
          // Remove undefined values before sending to Firestore
          const cleanLetter = this.removeUndefined(letter);
          await firestoreService.create<CoverLetter & { userId: string; createdAt: Date; updatedAt: Date }>(
            'coverLetters',
            userId,
            letter.id,
            cleanLetter
          );
          result.lettersMigrated++;
        }
      } catch (error) {
        result.errors.push(new Error(`Cover letter migration failed: ${error}`));
      }

      // Mark migration as complete if no critical errors
      if (result.errors.length === 0) {
        await this.markMigrationComplete(userId);
        result.success = true;
      }

      return result;
    } catch (error) {
      result.errors.push(error as Error);
      result.success = false;
      return result;
    }
  }

  /**
   * Mark migration as complete
   */
  async markMigrationComplete(userId: string): Promise<void> {
    const statusDoc = doc(firestoreDb, 'users', userId, 'metadata', 'migration');
    
    await setDoc(statusDoc, {
      userId,
      completed: true,
      completedAt: Timestamp.now(),
      version: MIGRATION_VERSION,
    });
  }

  /**
   * Check if migration is complete
   */
  private async isMigrationComplete(userId: string): Promise<boolean> {
    const statusDoc = await getDoc(
      doc(firestoreDb, 'users', userId, 'metadata', 'migration')
    );

    if (!statusDoc.exists()) {
      return false;
    }

    const status = statusDoc.data() as MigrationStatus;
    return status.completed && status.version >= MIGRATION_VERSION;
  }

  /**
   * Rollback migration (restore from Dexie)
   * This is a safety mechanism in case migration causes issues
   */
  async rollback(userId: string): Promise<void> {
    try {
      // Delete migration status
      const statusDoc = doc(firestoreDb, 'users', userId, 'metadata', 'migration');
      await setDoc(statusDoc, {
        userId,
        completed: false,
        completedAt: null,
        version: 0,
      });

      console.log('Migration rolled back. Dexie data preserved.');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Clear Dexie data after successful migration
   * Only call this after confirming Firestore data is correct
   */
  async clearDexieData(): Promise<void> {
    try {
      await dexieDb.profiles.clear();
      await dexieDb.jobPostings.clear();
      await dexieDb.coverLetters.clear();
      console.log('Dexie data cleared after successful migration');
    } catch (error) {
      console.error('Failed to clear Dexie data:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(userId: string): Promise<MigrationStatus | null> {
    try {
      const statusDoc = await getDoc(
        doc(firestoreDb, 'users', userId, 'metadata', 'migration')
      );

      if (!statusDoc.exists()) {
        return null;
      }

      const data = statusDoc.data();
      return {
        userId: data.userId,
        completed: data.completed,
        completedAt: data.completedAt?.toDate() || null,
        version: data.version,
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return null;
    }
  }
}

export const migrationService = new MigrationService();
