'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB, type SyncQueueItem, SYNC_PRIORITIES } from '@/lib/db-offline';
import { syncManager } from '@/lib/sync-manager';

interface OfflineState {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncError: string | null;
}

interface QueueForSyncOptions {
  entityType: SyncQueueItem['entityType'];
  entityId: string;
  operation: SyncQueueItem['operation'];
  data: Record<string, unknown>;
  priority?: number;
}

interface UseOfflineReturn extends OfflineState {
  queueForSync: (options: QueueForSyncOptions) => Promise<string>;
  syncPending: () => Promise<void>;
  clearSyncError: () => void;
  getPendingItems: () => Promise<SyncQueueItem[]>;
}

export function useOffline(): UseOfflineReturn {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    pendingSyncCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
  });
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const count = await offlineDB.syncQueue.count();
      setState(prev => ({ ...prev, pendingSyncCount: count }));
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
    }
  }, []);

  // Handle online/offline status changes
  useEffect(() => {
    isMountedRef.current = true;

    const handleOnline = () => {
      if (!isMountedRef.current) return;
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Auto-sync when coming back online
      syncManager.syncAll().then(() => {
        updatePendingCount();
      }).catch(console.error);
    };

    const handleOffline = () => {
      if (!isMountedRef.current) return;
      setState(prev => ({ ...prev, isOnline: false }));
    };

    // Set initial online status
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count update
    updatePendingCount();

    // Set up periodic count updates
    const countInterval = setInterval(updatePendingCount, 30000);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(countInterval);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [updatePendingCount]);

  // Register background sync (if supported)
  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Register for background sync
        return registration.sync.register('hill-haat-sync');
      }).catch(error => {
        console.log('Background sync not available:', error);
      });
    }
  }, []);

  // Queue an item for sync
  const queueForSync = useCallback(async (options: QueueForSyncOptions): Promise<string> => {
    const {
      entityType,
      entityId,
      operation,
      data,
      priority: customPriority,
    } = options;

    // Determine priority based on entity type
    let priority = customPriority ?? SYNC_PRIORITIES.LISTING;
    if (entityType === 'order') {
      priority = customPriority ?? SYNC_PRIORITIES.ORDER;
    } else if (entityType === 'cart') {
      priority = customPriority ?? SYNC_PRIORITIES.CART;
    } else if (entityType === 'user') {
      priority = customPriority ?? SYNC_PRIORITIES.USER;
    } else if (entityType === 'notification') {
      priority = customPriority ?? SYNC_PRIORITIES.NOTIFICATION;
    }

    const syncItem: SyncQueueItem = {
      id: `${entityType}-${entityId}-${operation}-${Date.now()}`,
      entityType,
      entityId,
      operation,
      data,
      priority,
      attempts: 0,
      maxAttempts: 5,
      createdAt: Date.now(),
    };

    try {
      // Check if there's an existing item for the same entity
      const existing = await offlineDB.syncQueue
        .where(['entityType', 'entityId'])
        .equals([entityType, entityId])
        .first();

      if (existing) {
        // Update existing item with new data and higher priority
        await offlineDB.syncQueue.update(existing.id, {
          ...syncItem,
          id: existing.id, // Keep the existing ID
          priority: Math.max(existing.priority, priority),
          createdAt: Date.now(), // Reset creation time
        });
        
        await updatePendingCount();
        return existing.id;
      }

      await offlineDB.syncQueue.add(syncItem);
      await updatePendingCount();

      // If online, try to sync immediately
      if (navigator.onLine) {
        // Debounce sync to avoid too many calls
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncManager.syncAll().then(updatePendingCount).catch(console.error);
        }, 1000);
      }

      return syncItem.id;
    } catch (error) {
      console.error('Failed to queue item for sync:', error);
      throw new Error('Failed to queue item for sync');
    }
  }, [updatePendingCount]);

  // Manually trigger sync of pending items
  const syncPending = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setState(prev => ({ ...prev, syncError: 'Cannot sync while offline' }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      await syncManager.syncAll();
      const lastSync = localStorage.getItem('lastSyncTime');
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: lastSync ? parseInt(lastSync, 10) : Date.now(),
      }));
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [updatePendingCount]);

  // Get all pending sync items
  const getPendingItems = useCallback(async (): Promise<SyncQueueItem[]> => {
    return offlineDB.syncQueue
      .orderBy('priority')
      .reverse()
      .toArray();
  }, []);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setState(prev => ({ ...prev, syncError: null }));
  }, []);

  return {
    ...state,
    queueForSync,
    syncPending,
    clearSyncError,
    getPendingItems,
  };
}

// Hook for specific entity offline operations
interface UseOfflineEntityOptions<T> {
  entityName: string;
  getById: (id: string) => Promise<T | undefined>;
  saveLocal: (entity: T) => Promise<void>;
  deleteLocal: (id: string) => Promise<void>;
}

export function useOfflineEntity<T extends { id: string }>(
  options: UseOfflineEntityOptions<T>
) {
  const { isOnline, queueForSync } = useOffline();

  const getEntity = useCallback(async (id: string): Promise<T | undefined> => {
    // Try local first
    const local = await options.getById(id);
    if (local) return local;

    // If online, could fetch from server here
    return undefined;
  }, [options]);

  const saveEntity = useCallback(async (
    entity: T,
    operation: 'create' | 'update',
    syncData: Record<string, unknown>
  ): Promise<void> => {
    // Save locally first
    await options.saveLocal(entity);

    // Queue for sync
    await queueForSync({
      entityType: options.entityName as SyncQueueItem['entityType'],
      entityId: entity.id,
      operation,
      data: syncData,
    });
  }, [options, queueForSync]);

  const deleteEntity = useCallback(async (
    id: string,
    syncData: Record<string, unknown>
  ): Promise<void> => {
    // Delete locally
    await options.deleteLocal(id);

    // Queue deletion for sync
    await queueForSync({
      entityType: options.entityName as SyncQueueItem['entityType'],
      entityId: id,
      operation: 'delete',
      data: syncData,
    });
  }, [options, queueForSync]);

  return {
    isOnline,
    getEntity,
    saveEntity,
    deleteEntity,
  };
}

export default useOffline;
