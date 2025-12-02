import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { migrationService, type MigrationResult } from '../services/migrationService';

interface MigrationHandlerProps {
  children: ReactNode;
}

export function MigrationHandler({ children }: MigrationHandlerProps) {
  const { currentUser } = useAuth();
  const [migrationState, setMigrationState] = useState<{
    checking: boolean;
    migrating: boolean;
    result: MigrationResult | null;
    error: Error | null;
  }>({
    checking: false,
    migrating: false,
    result: null,
    error: null,
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const checkAndMigrate = async () => {
      try {
        setMigrationState(prev => ({ ...prev, checking: true }));

        const needsMigration = await migrationService.needsMigration(currentUser.uid);

        if (needsMigration) {
          setMigrationState(prev => ({ ...prev, checking: false, migrating: true }));

          const result = await migrationService.migrate(currentUser.uid);

          setMigrationState({
            checking: false,
            migrating: false,
            result,
            error: null,
          });

          // Auto-dismiss success message after 5 seconds
          if (result.success) {
            setTimeout(() => {
              setMigrationState(prev => ({ ...prev, result: null }));
            }, 5000);
          }
        } else {
          setMigrationState({
            checking: false,
            migrating: false,
            result: null,
            error: null,
          });
        }
      } catch (error) {
        setMigrationState({
          checking: false,
          migrating: false,
          result: null,
          error: error as Error,
        });
      }
    };

    checkAndMigrate();
  }, [currentUser]);

  const handleRetry = async () => {
    if (!currentUser) return;

    try {
      setMigrationState(prev => ({ ...prev, migrating: true, error: null }));
      const result = await migrationService.migrate(currentUser.uid);
      setMigrationState({
        checking: false,
        migrating: false,
        result,
        error: null,
      });
    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        migrating: false,
        error: error as Error,
      }));
    }
  };

  const handleDismiss = () => {
    setMigrationState(prev => ({ ...prev, result: null, error: null }));
  };

  // Show loading state while checking
  if (migrationState.checking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3">
            <svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Checking for data migration...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show migration progress
  if (migrationState.migrating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Migrating Your Data</h3>
              <p className="text-gray-600">
                We're moving your data to cloud storage. This will only take a moment...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show migration result
  if (migrationState.result) {
    const { result } = migrationState;
    
    if (result.success) {
      return (
        <>
          {children}
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Migration Complete!</h4>
                <p className="text-sm">
                  Successfully migrated {result.profilesMigrated} profile(s), {result.jobsMigrated} job(s), 
                  and {result.lettersMigrated} cover letter(s) to cloud storage.
                </p>
                <button
                  onClick={handleDismiss}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          {children}
          <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Migration Incomplete</h4>
                <p className="text-sm mb-2">
                  Some data couldn't be migrated. Your local data is safe.
                </p>
                {result.errors.length > 0 && (
                  <p className="text-xs mb-2">
                    {result.errors[0].message}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="text-sm bg-yellow-200 hover:bg-yellow-300 px-3 py-1 rounded"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-sm underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  // Show migration error
  if (migrationState.error) {
    return (
      <>
        {children}
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-800 px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Migration Error</h4>
              <p className="text-sm mb-2">{migrationState.error.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="text-sm bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
                >
                  Retry
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
