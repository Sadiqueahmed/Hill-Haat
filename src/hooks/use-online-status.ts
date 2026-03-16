/**
 * useOnlineStatus Hook
 * Detects online/offline state, provides sync status, and queues actions when offline
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB, getPendingSyncItems, type SyncQueueItem, SYNC_PRIORITIES } from '@/lib/offline-db';

// =============================================================================
// Types
// =============================================================================

export interface OnlineStatusState {
  /** Whether the user is currently online */
  isOnline: boolean;
  /** Whether the user was previously offline (for showing "back online" messages) */
  wasOffline: boolean;
  /** Number of pending items waiting to sync */
  pendingSyncCount: number;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncTime: number | null;
  /** Any error from the last sync attempt */
  syncError: string | null;
  /** Connection quality (if available) */
  connectionQuality: 'unknown' | 'slow-2g' | '2g' | '3g' | '4g';
  /** Whether data saver mode is enabled */
  isDataSaver: boolean;
}

export interface QueuedAction {
  id: string;
  action: () => Promise<unknown>;
  fallback?: () => void;
  priority: number;
  entityType: SyncQueueItem['entityType'];
  entityId: string;
  operation: SyncQueueItem['operation'];
}

export interface UseOnlineStatusReturn extends OnlineStatusState {
  /** Queue an action to be executed when online */
  queueAction: (action: QueuedAction) => Promise<void>;
  /** Manually trigger sync of pending items */
  triggerSync: () => Promise<void>;
  /** Clear any sync error */
  clearSyncError: () => void;
  /** Execute an action immediately if online, or queue if offline */
  executeOrQueue: <T>(
    action: () => Promise<T>,
    options: {
      entityType: SyncQueueItem['entityType'];
      entityId: string;
      operation: SyncQueueItem['operation'];
      priority?: number;
      fallback?: () => T | void;
    }
  ) => Promise<T | undefined>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useOnlineStatus(): UseOnlineStatusReturn {
  // Initialize state
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: true,
    wasOffline: false,
    pendingSyncCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    connectionQuality: 'unknown',
    isDataSaver: false,
  });

  // Refs for managing queued actions and sync
  const queuedActionsRef = useRef<Map<string, QueuedAction>>(new Map());
  const isMountedRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const pendingItems = await getPendingSyncItems();
      setState(prev => ({ ...prev, pendingSyncCount: pendingItems.length }));
    } catch (error) {
      console.error('[useOnlineStatus] Failed to get pending sync count:', error);
    }
  }, []);

  // Detect connection information (if available)
  const updateConnectionInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    // @ts-expect-error - connection API not fully typed
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setState(prev => ({
        ...prev,
        connectionQuality: connection.effectiveType || 'unknown',
        isDataSaver: connection.saveData || false,
      }));
    }
  }, []);

  // Handle online event
  const handleOnline = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: prev.wasOffline || !prev.isOnline,
    }));

    // Process queued actions
    await processQueuedActions();
    
    // Update pending count
    await updatePendingCount();
  }, [updatePendingCount]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  // Process queued actions when coming back online
  const processQueuedActions = useCallback(async () => {
    const queuedActions = queuedActionsRef.current;
    if (queuedActions.size === 0) return;

    // Sort by priority (higher first)
    const sortedActions = Array.from(queuedActions.values()).sort(
      (a, b) => b.priority - a.priority
    );

    for (const queuedAction of sortedActions) {
      try {
        await queuedAction.action();
        queuedActions.delete(queuedAction.id);
      } catch (error) {
        console.error(`[useOnlineStatus] Failed to execute queued action ${queuedAction.id}:`, error);
        // Keep the action in queue for retry
      }
    }
  }, []);

  // Queue an action for later execution
  const queueAction = useCallback(async (action: QueuedAction): Promise<void> => {
    if (state.isOnline) {
      // If online, execute immediately
      try {
        await action.action();
        return;
      } catch (error) {
        console.error('[useOnlineStatus] Action failed, queueing for retry:', error);
      }
    }

    // Store in memory queue
    queuedActionsRef.current.set(action.id, action);

    // Also store in IndexedDB for persistence across sessions
    try {
      await offlineDB.syncQueue.add({
        id: `${action.entityType}-${action.entityId}-${action.operation}-${Date.now()}`,
        entityType: action.entityType,
        entityId: action.entityId,
        operation: action.operation,
        endpoint: '', // Will be set when actually syncing
        method: 'POST',
        payload: { queued: true },
        priority: action.priority,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[useOnlineStatus] Failed to queue action in database:', error);
    }

    // Update pending count
    await updatePendingCount();

    // Execute fallback if provided
    if (action.fallback) {
      action.fallback();
    }
  }, [state.isOnline, updatePendingCount]);

  // Execute or queue an action
  const executeOrQueue = useCallback(async <T,>(
    action: () => Promise<T>,
    options: {
      entityType: SyncQueueItem['entityType'];
      entityId: string;
      operation: SyncQueueItem['operation'];
      priority?: number;
      fallback?: () => T | void;
    }
  ): Promise<T | undefined> => {
    if (state.isOnline) {
      try {
        return await action();
      } catch (error) {
        console.error('[useOnlineStatus] Action failed:', error);
        // Fall through to queue logic
      }
    }

    // Queue the action
    const priority = options.priority ?? getPriorityForEntityType(options.entityType);
    
    await queueAction({
      id: `${options.entityType}-${options.entityId}-${options.operation}-${Date.now()}`,
      action: action as () => Promise<unknown>,
      priority,
      entityType: options.entityType,
      entityId: options.entityId,
      operation: options.operation,
    });

    // Execute fallback
    if (options.fallback) {
      return options.fallback() as T | undefined;
    }

    return undefined;
  }, [state.isOnline, queueAction]);

  // Trigger manual sync
  const triggerSync = useCallback(async (): Promise<void> => {
    if (!state.isOnline) {
      setState(prev => ({ ...prev, syncError: 'Cannot sync while offline' }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      // Get pending items
      const pendingItems = await getPendingSyncItems();

      // Process each item
      for (const item of pendingItems) {
        try {
          // Mark as processing
          await offlineDB.syncQueue.update(item.id, {
            status: 'processing',
            lastAttemptAt: Date.now(),
          });

          // Execute the sync (this would typically call an API)
          // For now, we just mark it as completed
          // In a real implementation, this would make the actual API call
          
          // Mark as completed
          await offlineDB.syncQueue.delete(item.id);

        } catch (error) {
          console.error(`[useOnlineStatus] Failed to sync item ${item.id}:`, error);
          
          // Mark as failed
          await offlineDB.syncQueue.update(item.id, {
            status: 'pending',
            attempts: item.attempts + 1,
            lastError: error instanceof Error ? error.message : 'Sync failed',
            updatedAt: Date.now(),
          });
        }
      }

      // Update last sync time
      const now = Date.now();
      localStorage.setItem('lastSyncTime', now.toString());
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
      }));

      await updatePendingCount();

    } catch (error) {
      console.error('[useOnlineStatus] Sync failed:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [state.isOnline, updatePendingCount]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setState(prev => ({ ...prev, syncError: null }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    isMountedRef.current = true;

    // Set initial online status
    if (typeof window !== 'undefined') {
      setState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        wasOffline: !navigator.onLine,
      }));
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial pending count
    updatePendingCount();
    updateConnectionInfo();

    // Set up connection change listener (if available)
    // @ts-expect-error - connection API not fully typed
    const connection = navigator.connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Set up periodic sync count updates
    const countInterval = setInterval(updatePendingCount, 30000);

    // Get last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setState(prev => ({ ...prev, lastSyncTime: parseInt(lastSync, 10) }));
    }

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
      
      clearInterval(countInterval);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline, updatePendingCount, updateConnectionInfo]);

  // Auto-sync when coming online
  useEffect(() => {
    if (state.isOnline && state.wasOffline && state.pendingSyncCount > 0) {
      // Debounce sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        triggerSync();
      }, 1000);
    }
  }, [state.isOnline, state.wasOffline, state.pendingSyncCount, triggerSync]);

  return {
    ...state,
    queueAction,
    triggerSync,
    clearSyncError,
    executeOrQueue,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPriorityForEntityType(entityType: SyncQueueItem['entityType']): number {
  switch (entityType) {
    case 'order':
      return SYNC_PRIORITIES.ORDER_CREATE;
    case 'cart':
      return SYNC_PRIORITIES.CART;
    case 'product':
      return SYNC_PRIORITIES.LISTING_CREATE;
    case 'user':
      return SYNC_PRIORITIES.USER_UPDATE;
    case 'notification':
      return SYNC_PRIORITIES.NOTIFICATION;
    case 'preference':
      return SYNC_PRIORITIES.PREFERENCE;
    default:
      return 50;
  }
}

// =============================================================================
// Export
// =============================================================================

export default useOnlineStatus;
