import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { syncService, type SyncStatus } from '../services/syncService';
import { useAuth } from './AuthContext';

interface SyncContextType extends SyncStatus {
  forceSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribeStatus = syncService.subscribe(setSyncStatus);

    // Monitor Firestore connection if user is authenticated
    let unsubscribeConnection: (() => void) | undefined;
    if (currentUser) {
      unsubscribeConnection = syncService.monitorFirestoreConnection(currentUser.uid);
    }

    return () => {
      unsubscribeStatus();
      if (unsubscribeConnection) {
        unsubscribeConnection();
      }
    };
  }, [currentUser]);

  const forceSync = () => {
    // Force a sync by triggering a status update
    syncService.startSync();
    // The actual sync happens automatically via Firestore's offline persistence
    setTimeout(() => {
      syncService.completeSync();
    }, 1000);
  };

  const value: SyncContextType = {
    ...syncStatus,
    forceSync,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}
