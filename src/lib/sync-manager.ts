import { offlineDB, type SyncQueueItem, checkStorageQuota, clearOldData } from './db-offline';

// Retry configuration
const RETRY_DELAYS = [
  1000,      // 1 second
  5000,      // 5 seconds
  15000,     // 15 seconds
  60000,     // 1 minute
  300000,    // 5 minutes
];

const MAX_RETRIES = 5;

// Conflict resolution strategies
type ConflictStrategy = 'server_wins' | 'client_wins' | 'merge';

interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedData: Record<string, unknown>;
}

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncManager {
  private isProcessing = false;
  private abortController: AbortController | null = null;

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isProcessing) {
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Clean up old data first
      await clearOldData();

      // Check storage quota
      const quota = await checkStorageQuota();
      if (quota.percentageUsed > 90) {
        console.warn('Storage quota nearly exceeded, cleaning up...');
        await clearOldData();
      }

      // Get all pending items sorted by priority
      const pendingItems = await offlineDB.syncQueue
        .orderBy('priority')
        .reverse()
        .toArray();

      // Process items in batches
      const batchSize = 5;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        if (this.abortController.signal.aborted) {
          break;
        }

        const batch = pendingItems.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(item => this.processSyncItem(item))
        );

        for (let j = 0; j < batchResults.length; j++) {
          const batchResult = batchResults[j];
          const item = batch[j];

          if (batchResult.status === 'fulfilled' && batchResult.value) {
            result.processed++;
            // Remove from queue on success
            await offlineDB.syncQueue.delete(item.id);
          } else {
            result.failed++;
            const error = batchResult.status === 'rejected' 
              ? batchResult.reason 
              : 'Unknown error';
            
            result.errors.push({
              id: item.id,
              error: String(error),
            });

            // Update retry info
            await this.updateRetryInfo(item, String(error));
          }
        }
      }

      // Update last sync time
      localStorage.setItem('lastSyncTime', Date.now().toString());
      
      result.success = result.failed === 0;
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }

    return result;
  }

  /**
   * Process a single sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      // Check if item has exceeded max retries
      if (item.attempts >= item.maxAttempts) {
        console.warn(`Item ${item.id} exceeded max retries, removing from queue`);
        await offlineDB.syncQueue.delete(item.id);
        return false;
      }

      // Route to appropriate sync handler
      switch (item.entityType) {
        case 'order':
          return await this.syncOrder(item);
        case 'cart':
          return await this.syncCart(item);
        case 'listing':
          return await this.syncListing(item);
        case 'user':
          return await this.syncUser(item);
        case 'notification':
          return await this.syncNotification(item);
        default:
          console.warn(`Unknown entity type: ${item.entityType}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to process sync item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Sync order to server
   */
  private async syncOrder(item: SyncQueueItem): Promise<boolean> {
    const { operation, data } = item;

    try {
      let response: Response;
      const apiUrl = '/api/orders';

      switch (operation) {
        case 'create':
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: this.abortController?.signal,
          });
          break;
        case 'update':
          response = await fetch(`${apiUrl}/${item.entityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: this.abortController?.signal,
          });
          break;
        case 'delete':
          response = await fetch(`${apiUrl}/${item.entityId}`, {
            method: 'DELETE',
            signal: this.abortController?.signal,
          });
          break;
        default:
          return false;
      }

      if (!response.ok) {
        // Handle conflict
        if (response.status === 409) {
          const serverData = await response.json();
          const resolution = await this.resolveConflict(item, serverData);
          
          // Re-queue with resolved data
          await offlineDB.syncQueue.update(item.id, {
            data: resolution.resolvedData,
          });
          
          return false; // Will retry with resolved data
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Update local order with server response
      const serverOrder = await response.json();
      await offlineDB.orders.update(item.entityId, {
        ...serverOrder,
        syncedAt: new Date().toISOString(),
        dirty: false,
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync cart to server
   */
  private async syncCart(item: SyncQueueItem): Promise<boolean> {
    const { operation, data } = item;

    try {
      let response: Response;
      const apiUrl = '/api/cart';

      switch (operation) {
        case 'create':
        case 'update':
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: this.abortController?.signal,
          });
          break;
        case 'delete':
          response = await fetch(`${apiUrl}?listingId=${item.entityId}`, {
            method: 'DELETE',
            signal: this.abortController?.signal,
          });
          break;
        default:
          return false;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Update local cart item
      if (operation !== 'delete') {
        await offlineDB.cart.update(item.entityId, {
          updatedAt: Date.now(),
          dirty: false,
        });
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync listing to server
   */
  private async syncListing(item: SyncQueueItem): Promise<boolean> {
    const { operation, data } = item;

    try {
      let response: Response;
      const apiUrl = '/api/listings';

      switch (operation) {
        case 'create':
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: this.abortController?.signal,
          });
          break;
        case 'update':
          response = await fetch(`${apiUrl}/${item.entityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: this.abortController?.signal,
          });
          break;
        case 'delete':
          response = await fetch(`${apiUrl}/${item.entityId}`, {
            method: 'DELETE',
            signal: this.abortController?.signal,
          });
          break;
        default:
          return false;
      }

      if (!response.ok) {
        if (response.status === 409) {
          const serverData = await response.json();
          const resolution = await this.resolveConflict(item, serverData);
          
          await offlineDB.syncQueue.update(item.id, {
            data: resolution.resolvedData,
          });
          
          return false;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Update local listing
      const serverListing = await response.json();
      await offlineDB.listings.update(item.entityId, {
        ...serverListing,
        cachedAt: Date.now(),
        dirty: false,
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync user to server
   */
  private async syncUser(item: SyncQueueItem): Promise<boolean> {
    const { operation, data } = item;

    try {
      const apiUrl = '/api/users/sync';

      if (operation === 'update') {
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        // Update local user
        const serverUser = await response.json();
        await offlineDB.users.update(item.entityId, {
          ...serverUser,
          cachedAt: Date.now(),
          dirty: false,
        });

        return true;
      }

      return false;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync notification to server
   */
  private async syncNotification(item: SyncQueueItem): Promise<boolean> {
    const { operation, data } = item;

    try {
      const apiUrl = '/api/notifications';

      if (operation === 'update') {
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        // Update local notification
        await offlineDB.notifications.update(item.entityId, {
          syncedAt: new Date().toISOString(),
          dirty: false,
        });

        return true;
      }

      return false;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Resolve sync conflict
   */
  private async resolveConflict(
    item: SyncQueueItem,
    serverData: Record<string, unknown>
  ): Promise<ConflictResolution> {
    // Determine conflict resolution strategy based on entity type
    let strategy: ConflictStrategy;

    switch (item.entityType) {
      case 'order':
        // For orders, server wins to maintain consistency
        strategy = 'server_wins';
        break;
      case 'listing':
        // For listings, merge if possible
        strategy = 'merge';
        break;
      case 'cart':
        // For cart, client wins (user's intent)
        strategy = 'client_wins';
        break;
      default:
        strategy = 'server_wins';
    }

    let resolvedData: Record<string, unknown>;

    switch (strategy) {
      case 'server_wins':
        resolvedData = serverData;
        break;
      case 'client_wins':
        resolvedData = item.data;
        break;
      case 'merge':
        resolvedData = this.mergeData(item.data, serverData);
        break;
      default:
        resolvedData = serverData;
    }

    return { strategy, resolvedData };
  }

  /**
   * Merge client and server data
   */
  private mergeData(
    clientData: Record<string, unknown>,
    serverData: Record<string, unknown>
  ): Record<string, unknown> {
    // Simple merge strategy: server wins for critical fields, client wins for others
    const criticalFields = ['id', 'createdAt', 'status', 'paymentStatus'];
    
    const merged = { ...serverData, ...clientData };
    
    // Restore critical server fields
    for (const field of criticalFields) {
      if (serverData[field] !== undefined) {
        merged[field] = serverData[field];
      }
    }
    
    return merged;
  }

  /**
   * Update retry information for failed sync
   */
  private async updateRetryInfo(item: SyncQueueItem, error: string): Promise<void> {
    const attempts = item.attempts + 1;
    const delay = RETRY_DELAYS[Math.min(attempts - 1, RETRY_DELAYS.length - 1)];
    const nextRetryAt = Date.now() + delay;

    if (attempts >= item.maxAttempts) {
      // Remove failed items after max retries
      await offlineDB.syncQueue.delete(item.id);
    } else {
      await offlineDB.syncQueue.update(item.id, {
        attempts,
        lastAttempt: Date.now(),
        lastError: error,
        nextRetryAt,
      });
    }
  }

  /**
   * Abort current sync operation
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isProcessing;
  }

  /**
   * Get count of pending sync items
   */
  async getPendingCount(): Promise<number> {
    return offlineDB.syncQueue.count();
  }

  /**
   * Clear all pending sync items (use with caution)
   */
  async clearQueue(): Promise<void> {
    await offlineDB.syncQueue.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Types
export type { SyncResult, ConflictResolution };
