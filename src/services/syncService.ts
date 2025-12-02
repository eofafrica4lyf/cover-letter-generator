import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: Error | null;
  pendingChanges: number;
}

type SyncStatusListener = (status: SyncStatus) => void;

class SyncService {
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    pendingChanges: 0,
  };

  private listeners: Set<SyncStatusListener> = new Set();
  private unsubscribeNetworkListener?: () => void;

  constructor() {
    this.initializeNetworkListeners();
  }

  /**
   * Initialize network status listeners
   */
  private initializeNetworkListeners(): void {
    const handleOnline = () => {
      this.updateStatus({ isOnline: true, syncError: null });
    };

    const handleOffline = () => {
      this.updateStatus({ isOnline: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.unsubscribeNetworkListener = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Update sync status and notify listeners
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.status);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Mark sync as started
   */
  startSync(): void {
    this.updateStatus({ isSyncing: true, syncError: null });
  }

  /**
   * Mark sync as completed
   */
  completeSync(): void {
    this.updateStatus({
      isSyncing: false,
      lastSyncTime: new Date(),
      syncError: null,
    });
  }

  /**
   * Mark sync as failed
   */
  failSync(error: Error): void {
    this.updateStatus({
      isSyncing: false,
      syncError: error,
    });
  }

  /**
   * Update pending changes count
   */
  setPendingChanges(count: number): void {
    this.updateStatus({ pendingChanges: count });
  }

  /**
   * Monitor Firestore connection state
   * This creates a minimal listener to detect when Firestore is syncing
   */
  monitorFirestoreConnection(userId: string): () => void {
    // Create a minimal collection listener to detect sync state
    const metadataRef = collection(db, 'users', userId, 'metadata');
    
    const unsubscribe = onSnapshot(
      metadataRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        const hasPendingWrites = snapshot.metadata.hasPendingWrites;
        const fromCache = snapshot.metadata.fromCache;
        
        if (hasPendingWrites) {
          this.updateStatus({ isSyncing: true });
        } else if (!fromCache) {
          this.completeSync();
        }
      },
      (error) => {
        console.error('Connection monitoring error:', error);
        this.failSync(error as Error);
      }
    );

    return unsubscribe;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.unsubscribeNetworkListener) {
      this.unsubscribeNetworkListener();
    }
    this.listeners.clear();
  }
}

export const syncService = new SyncService();
