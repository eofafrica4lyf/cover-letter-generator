import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  writeBatch,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ErrorCodes } from '../types';

export interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  userId: string;
  id: string;
  data?: any;
}

class FirestoreService {
  /**
   * Get a user-scoped collection reference
   */
  getUserCollection(userId: string, collectionName: string): CollectionReference {
    return collection(db, 'users', userId, collectionName);
  }

  /**
   * Convert Firestore Timestamp to Date and preserve arrays
   */
  private convertTimestamps<T>(data: DocumentData): T {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.convertTimestamps(item)) as unknown as T;
    }

    // Handle Timestamp objects
    if (data instanceof Timestamp) {
      return data.toDate() as unknown as T;
    }

    // Handle plain objects
    if (typeof data === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = this.convertTimestamps(value);
      }
      return converted as T;
    }

    return data;
  }

  /**
   * Create a new document
   */
  async create<T extends FirestoreDocument>(
    collectionName: string,
    userId: string,
    id: string,
    data: Omit<T, 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<void> {
    try {
      const docRef = doc(this.getUserCollection(userId, collectionName), id);
      const now = Timestamp.now();
      
      await setDoc(docRef, {
        ...data,
        id,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error: any) {
      if (error.code === 'resource-exhausted') {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Read a single document
   */
  async read<T extends FirestoreDocument>(
    collectionName: string,
    userId: string,
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(this.getUserCollection(userId, collectionName), id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.convertTimestamps<T>(docSnap.data());
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update<T>(
    collectionName: string,
    userId: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(this.getUserCollection(userId, collectionName), id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      if (error.code === 'not-found') {
        throw new Error('Document not found');
      }
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(
    collectionName: string,
    userId: string,
    id: string
  ): Promise<void> {
    try {
      const docRef = doc(this.getUserCollection(userId, collectionName), id);
      await deleteDoc(docRef);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * List documents with optional filters
   */
  async list<T extends FirestoreDocument>(
    collectionName: string,
    userId: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const collectionRef = this.getUserCollection(userId, collectionName);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.convertTimestamps<T>(doc.data())
      );
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe<T extends FirestoreDocument>(
    collectionName: string,
    userId: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const collectionRef = this.getUserCollection(userId, collectionName);
    const q = query(collectionRef, ...constraints);
    
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => 
          this.convertTimestamps<T>(doc.data())
        );
        callback(data);
      },
      (error) => {
        console.error('Subscription error:', error);
        if (error.code === 'permission-denied') {
          throw new Error('Permission denied. Please re-authenticate.');
        }
      }
    );
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      for (const op of operations) {
        const docRef = doc(this.getUserCollection(op.userId, op.collection), op.id);
        
        switch (op.type) {
          case 'create':
            batch.set(docRef, {
              ...op.data,
              id: op.id,
              userId: op.userId,
              createdAt: now,
              updatedAt: now,
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: now,
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }
      
      await batch.commit();
    } catch (error: any) {
      if (error.code === 'resource-exhausted') {
        throw new Error(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      }
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please re-authenticate.');
      }
      if (error.code === 'unavailable') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Delete all user data (for account deletion)
   */
  async deleteAllUserData(userId: string): Promise<void> {
    const collections = ['profiles', 'jobs', 'coverLetters'];
    const operations: BatchOperation[] = [];
    
    for (const collectionName of collections) {
      const docs = await this.list(collectionName, userId);
      docs.forEach(doc => {
        operations.push({
          type: 'delete',
          collection: collectionName,
          userId,
          id: doc.id,
        });
      });
    }
    
    if (operations.length > 0) {
      await this.batchWrite(operations);
    }
  }
}

export const firestoreService = new FirestoreService();
