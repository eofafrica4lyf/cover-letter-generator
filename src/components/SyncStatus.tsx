import { useSync } from '../contexts/SyncContext';

export function SyncStatus() {
  const { isOnline, isSyncing, lastSyncTime, syncError, pendingChanges } = useSync();

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <div>
          <div className="font-semibold">Offline</div>
          {pendingChanges > 0 && (
            <div className="text-sm">{pendingChanges} changes pending</div>
          )}
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div className="font-semibold">Sync Error</div>
          <div className="text-sm">{syncError.message}</div>
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Syncing...</span>
      </div>
    );
  }

  if (lastSyncTime) {
    const timeSince = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    let timeText = '';
    
    if (timeSince < 60) {
      timeText = 'just now';
    } else if (timeSince < 3600) {
      timeText = `${Math.floor(timeSince / 60)}m ago`;
    } else {
      timeText = `${Math.floor(timeSince / 3600)}h ago`;
    }

    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm">Synced {timeText}</span>
      </div>
    );
  }

  return null;
}
