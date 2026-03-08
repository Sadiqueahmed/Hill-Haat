'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOffline } from '@/hooks/use-offline';
import { toast } from 'sonner';

interface OfflineIndicatorProps {
  className?: string;
  showPendingCount?: boolean;
  compact?: boolean;
}

export function OfflineIndicator({ 
  className = '', 
  showPendingCount = true,
  compact = false 
}: OfflineIndicatorProps) {
  const { 
    isOnline, 
    pendingSyncCount, 
    isSyncing, 
    syncError,
    syncPending, 
    clearSyncError 
  } = useOffline();

  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Show toast notifications for status changes
  useEffect(() => {
    if (!isOnline) {
      toast.warning('You are offline. Changes will be saved locally.', {
        icon: <CloudOff className="h-4 w-4" />,
        duration: 4000,
      });
    } else if (isOnline && pendingSyncCount > 0) {
      toast.info('Back online! Syncing pending changes...', {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        duration: 3000,
      });
    }
  }, [isOnline, pendingSyncCount]);

  // Handle manual sync
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline', {
        icon: <WifiOff className="h-4 w-4" />,
      });
      return;
    }

    if (pendingSyncCount === 0) {
      toast.success('All data is up to date');
      return;
    }

    try {
      await syncPending();
      setShowSyncSuccess(true);
      toast.success(`Successfully synced ${pendingSyncCount} item(s)`, {
        icon: <CheckCircle className="h-4 w-4" />,
      });
      
      setTimeout(() => {
        setShowSyncSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error('Sync failed. Will retry automatically.', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  // Compact mode for smaller spaces
  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        {showPendingCount && pendingSyncCount > 0 && (
          <Badge 
            variant={isOnline ? 'secondary' : 'destructive'} 
            className="ml-1 px-1.5 py-0 text-[10px]"
          >
            {pendingSyncCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md border border-red-500/20">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}

      {/* Pending Sync Indicator */}
      {isOnline && showPendingCount && pendingSyncCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge 
            variant={syncError ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
          >
            <CloudOff className="h-3 w-3" />
            <span>{pendingSyncCount} pending</span>
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 px-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : showSyncSuccess ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}

      {/* Sync Error */}
      {syncError && (
        <Badge 
          variant="destructive"
          className="cursor-pointer"
          onClick={() => {
            clearSyncError();
            handleSync();
          }}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Sync error - Click to retry
        </Badge>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </div>
      )}
    </div>
  );
}

// Full-width offline banner for mobile
export function OfflineBanner() {
  const { isOnline, pendingSyncCount, syncPending, isSyncing } = useOffline();

  if (isOnline) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 md:relative md:top-auto">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You&apos;re offline. {pendingSyncCount > 0 && `${pendingSyncCount} items pending sync.`}
        </span>
      </div>
      
      {pendingSyncCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={syncPending}
          disabled={isSyncing}
          className="h-7 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Sync when online
        </Button>
      )}
    </div>
  );
}

// Sync status panel for settings/debugging
export function SyncStatusPanel() {
  const { 
    isOnline, 
    pendingSyncCount, 
    isSyncing, 
    syncError, 
    lastSyncTime,
    syncPending,
    getPendingItems,
    clearSyncError 
  } = useOffline();

  const [pendingItems, setPendingItems] = useState<Array<{
    id: string;
    entityType: string;
    operation: string;
    createdAt: number;
    attempts: number;
    lastError?: string;
  }>>([]);

  useEffect(() => {
    getPendingItems().then(items => {
      setPendingItems(items.map(item => ({
        id: item.id,
        entityType: item.entityType,
        operation: item.operation,
        createdAt: item.createdAt,
        attempts: item.attempts,
        lastError: item.lastError,
      })));
    });
  }, [getPendingItems, pendingSyncCount]);

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sync Status</h3>
        <Badge variant={isOnline ? 'default' : 'destructive'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Pending Items</p>
          <p className="font-medium">{pendingSyncCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last Sync</p>
          <p className="font-medium">
            {lastSyncTime 
              ? new Date(lastSyncTime).toLocaleString()
              : 'Never'}
          </p>
        </div>
      </div>

      {syncError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Sync Error</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{syncError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearSyncError();
              syncPending();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {pendingItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending Items</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {pendingItems.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
              >
                <div>
                  <span className="font-medium capitalize">{item.entityType}</span>
                  <span className="text-muted-foreground ml-1">({item.operation})</span>
                </div>
                <div className="text-muted-foreground">
                  {item.attempts > 0 && (
                    <span className="text-amber-500">{item.attempts} retries</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={syncPending}
        disabled={!isOnline || isSyncing}
        className="w-full"
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </>
        )}
      </Button>
    </div>
  );
}

export default OfflineIndicator;
