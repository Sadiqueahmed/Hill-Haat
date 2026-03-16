/**
 * Hill-Haat Offline Database
 * IndexedDB-based offline storage using Dexie.js
 * Supports products, orders, sync queue, and user preferences
 */

import Dexie, { type EntityTable } from 'dexie';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Cached product listing for offline access
 */
export interface OfflineProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity?: number;
  quality: string;
  isOrganic: boolean;
  isVerified: boolean;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  viewCount: number;
  orderCount: number;
  availableFrom?: string;
  availableUntil?: string;
  harvestDate?: string;
  status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'DRAFT';
  cachedAt: number;
  updatedAt: number;
  expiresAt: number;
}

/**
 * Offline order for queue management
 */
export interface OfflineOrder {
  id: string;
  tempId: string;
  orderNumber?: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  deliveryPincode?: string;
  deliveryPhone?: string;
  notes?: string;
  estimatedDelivery?: string;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncError?: string;
  localData: Record<string, unknown>;
}

/**
 * Sync queue item for tracking pending operations
 */
export interface SyncQueueItem {
  id: string;
  entityType: 'product' | 'order' | 'user' | 'cart' | 'notification' | 'preference';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: Record<string, unknown>;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * User preferences stored locally
 */
export interface UserPreferences {
  id: string;
  userId?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  orderNotifications: boolean;
  listingNotifications: boolean;
  messageNotifications: boolean;
  defaultDeliveryAddress?: string;
  defaultDeliveryDistrict?: string;
  defaultDeliveryState?: string;
  preferredCategories: string[];
  preferredStates: string[];
  searchHistory: string[];
  recentlyViewed: string[];
  cartBadge: boolean;
  offlineMode: boolean;
  dataSaver: boolean;
  autoSync: boolean;
  syncInterval: number;
  lastSyncAt?: number;
  updatedAt: number;
}

// =============================================================================
// Priority Constants
// =============================================================================

export const SYNC_PRIORITIES = {
  ORDER_CREATE: 100,
  ORDER_UPDATE: 90,
  PAYMENT: 95,
  CART: 80,
  LISTING_CREATE: 70,
  LISTING_UPDATE: 60,
  USER_UPDATE: 40,
  NOTIFICATION: 20,
  PREFERENCE: 10,
} as const;

// =============================================================================
// Database Class
// =============================================================================

class HillHaatOfflineDatabase extends Dexie {
  products!: EntityTable<OfflineProduct, 'id'>;
  orders!: EntityTable<OfflineOrder, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  userPreferences!: EntityTable<UserPreferences, 'id'>;

  constructor() {
    super('HillHaatOffline');
    
    this.version(1).stores({
      products: 'id, category, state, district, sellerId, status, cachedAt, updatedAt, expiresAt',
      orders: 'id, tempId, buyerId, sellerId, listingId, status, syncStatus, createdAt, updatedAt',
      syncQueue: 'id, entityType, entityId, operation, priority, status, createdAt, nextRetryAt',
      userPreferences: 'id, userId, updatedAt',
    });
  }
}

// Database singleton
let dbInstance: HillHaatOfflineDatabase | null = null;

export function getOfflineDB(): HillHaatOfflineDatabase {
  if (!dbInstance) {
    dbInstance = new HillHaatOfflineDatabase();
  }
  return dbInstance;
}

export const offlineDB = getOfflineDB();

// =============================================================================
// Product Operations
// =============================================================================

/**
 * Cache a product for offline access
 */
export async function cacheProduct(product: Omit<OfflineProduct, 'cachedAt' | 'updatedAt' | 'expiresAt'>): Promise<void> {
  const db = getOfflineDB();
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
  
  await db.products.put({
    ...product,
    cachedAt: now,
    updatedAt: now,
    expiresAt,
  });
}

/**
 * Cache multiple products at once
 */
export async function cacheProducts(products: Array<Omit<OfflineProduct, 'cachedAt' | 'updatedAt' | 'expiresAt'>>): Promise<void> {
  const db = getOfflineDB();
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  
  const productsWithTimestamps = products.map(product => ({
    ...product,
    cachedAt: now,
    updatedAt: now,
    expiresAt,
  }));
  
  await db.products.bulkPut(productsWithTimestamps);
}

/**
 * Get a cached product by ID
 */
export async function getCachedProduct(id: string): Promise<OfflineProduct | undefined> {
  const db = getOfflineDB();
  return db.products.get(id);
}

/**
 * Get all cached products, optionally filtered
 */
export async function getCachedProducts(options?: {
  category?: string;
  state?: string;
  district?: string;
  sellerId?: string;
  status?: string;
  limit?: number;
}): Promise<OfflineProduct[]> {
  const db = getOfflineDB();
  let query = db.products.where('status').equals('ACTIVE');
  
  if (options?.category) {
    query = db.products.where('category').equals(options.category);
  }
  
  let products = await query.toArray();
  
  // Apply additional filters
  if (options?.state) {
    products = products.filter(p => p.state === options.state);
  }
  if (options?.district) {
    products = products.filter(p => p.district === options.district);
  }
  if (options?.sellerId) {
    products = products.filter(p => p.sellerId === options.sellerId);
  }
  
  // Filter out expired products
  const now = Date.now();
  products = products.filter(p => p.expiresAt > now);
  
  if (options?.limit) {
    products = products.slice(0, options.limit);
  }
  
  return products;
}

/**
 * Remove expired products from cache
 */
export async function cleanExpiredProducts(): Promise<number> {
  const db = getOfflineDB();
  const now = Date.now();
  const expiredCount = await db.products
    .where('expiresAt')
    .below(now)
    .delete();
  return expiredCount;
}

// =============================================================================
// Order Operations
// =============================================================================

/**
 * Create an offline order
 */
export async function createOfflineOrder(order: Omit<OfflineOrder, 'createdAt' | 'updatedAt' | 'syncStatus' | 'syncAttempts'>): Promise<string> {
  const db = getOfflineDB();
  const now = Date.now();
  
  const offlineOrder: OfflineOrder = {
    ...order,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    syncAttempts: 0,
  };
  
  await db.orders.put(offlineOrder);
  return order.id;
}

/**
 * Get an offline order by ID
 */
export async function getOfflineOrder(id: string): Promise<OfflineOrder | undefined> {
  const db = getOfflineDB();
  return db.orders.get(id);
}

/**
 * Get all offline orders for a user
 */
export async function getOfflineOrders(userId: string, role: 'buyer' | 'seller'): Promise<OfflineOrder[]> {
  const db = getOfflineDB();
  
  if (role === 'buyer') {
    return db.orders.where('buyerId').equals(userId).toArray();
  } else {
    return db.orders.where('sellerId').equals(userId).toArray();
  }
}

/**
 * Update offline order status
 */
export async function updateOfflineOrderStatus(
  id: string, 
  status: OfflineOrder['status'], 
  syncStatus?: OfflineOrder['syncStatus']
): Promise<void> {
  const db = getOfflineDB();
  const updates: Partial<OfflineOrder> = {
    status,
    updatedAt: Date.now(),
  };
  
  if (syncStatus) {
    updates.syncStatus = syncStatus;
  }
  
  await db.orders.update(id, updates);
}

/**
 * Mark order as synced
 */
export async function markOrderSynced(id: string, orderNumber?: string): Promise<void> {
  const db = getOfflineDB();
  await db.orders.update(id, {
    syncStatus: 'synced',
    syncedAt: Date.now(),
    orderNumber,
    updatedAt: Date.now(),
  });
}

/**
 * Mark order sync as failed
 */
export async function markOrderSyncFailed(id: string, error: string): Promise<void> {
  const db = getOfflineDB();
  const order = await db.orders.get(id);
  
  await db.orders.update(id, {
    syncStatus: 'failed',
    syncAttempts: (order?.syncAttempts || 0) + 1,
    lastSyncError: error,
    updatedAt: Date.now(),
  });
}

/**
 * Get pending orders that need to be synced
 */
export async function getPendingOrders(): Promise<OfflineOrder[]> {
  const db = getOfflineDB();
  return db.orders
    .where('syncStatus')
    .equals('pending')
    .toArray();
}

// =============================================================================
// Sync Queue Operations
// =============================================================================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'createdAt' | 'updatedAt' | 'status' | 'attempts'>): Promise<string> {
  const db = getOfflineDB();
  const now = Date.now();
  
  const queueItem: SyncQueueItem = {
    ...item,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.syncQueue.put(queueItem);
  return item.id;
}

/**
 * Get pending sync items, sorted by priority
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = getOfflineDB();
  const now = Date.now();
  
  return db.syncQueue
    .where('status')
    .equals('pending')
    .filter(item => !item.nextRetryAt || item.nextRetryAt <= now)
    .toArray()
    .then(items => items.sort((a, b) => b.priority - a.priority));
}

/**
 * Mark sync item as processing
 */
export async function markSyncItemProcessing(id: string): Promise<void> {
  const db = getOfflineDB();
  await db.syncQueue.update(id, {
    status: 'processing',
    lastAttemptAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Mark sync item as completed
 */
export async function markSyncItemCompleted(id: string): Promise<void> {
  const db = getOfflineDB();
  await db.syncQueue.delete(id);
}

/**
 * Mark sync item as failed and schedule retry
 */
export async function markSyncItemFailed(id: string, error: string): Promise<void> {
  const db = getOfflineDB();
  const item = await db.syncQueue.get(id);
  
  if (!item) return;
  
  const attempts = item.attempts + 1;
  const maxAttempts = item.maxAttempts || 5;
  
  if (attempts >= maxAttempts) {
    // Max retries reached, mark as permanently failed
    await db.syncQueue.update(id, {
      status: 'failed',
      attempts,
      lastError: error,
      updatedAt: Date.now(),
    });
  } else {
    // Calculate exponential backoff
    const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
    const nextRetryAt = Date.now() + backoffMs;
    
    await db.syncQueue.update(id, {
      status: 'pending',
      attempts,
      lastError: error,
      nextRetryAt,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Clear completed sync items
 */
export async function clearCompletedSyncItems(): Promise<void> {
  const db = getOfflineDB();
  await db.syncQueue.where('status').equals('completed').delete();
}

// =============================================================================
// User Preferences Operations
// =============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'default',
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  orderNotifications: true,
  listingNotifications: true,
  messageNotifications: true,
  preferredCategories: [],
  preferredStates: [],
  searchHistory: [],
  recentlyViewed: [],
  cartBadge: true,
  offlineMode: false,
  dataSaver: false,
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  updatedAt: Date.now(),
};

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const db = getOfflineDB();
  const prefs = await db.userPreferences.get('default');
  
  if (!prefs) {
    // Create default preferences
    await db.userPreferences.put(DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  }
  
  return prefs;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
  const db = getOfflineDB();
  const current = await getUserPreferences();
  
  await db.userPreferences.put({
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Add to search history
 */
export async function addToSearchHistory(query: string): Promise<void> {
  const db = getOfflineDB();
  const prefs = await getUserPreferences();
  
  // Remove duplicate and add to front
  const searchHistory = [query, ...prefs.searchHistory.filter(h => h !== query)].slice(0, 20);
  
  await db.userPreferences.update('default', {
    searchHistory,
    updatedAt: Date.now(),
  });
}

/**
 * Add to recently viewed products
 */
export async function addToRecentlyViewed(productId: string): Promise<void> {
  const db = getOfflineDB();
  const prefs = await getUserPreferences();
  
  // Remove duplicate and add to front
  const recentlyViewed = [productId, ...prefs.recentlyViewed.filter(id => id !== productId)].slice(0, 50);
  
  await db.userPreferences.update('default', {
    recentlyViewed,
    updatedAt: Date.now(),
  });
}

/**
 * Update last sync time
 */
export async function updateLastSyncTime(): Promise<void> {
  const db = getOfflineDB();
  await db.userPreferences.update('default', {
    lastSyncAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// =============================================================================
// Storage Management
// =============================================================================

/**
 * Check storage quota
 */
export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  available: number;
  percentageUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      available: quota - usage,
      percentageUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return {
    usage: 0,
    quota: Infinity,
    available: Infinity,
    percentageUsed: 0,
  };
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  products: number;
  orders: number;
  syncQueue: number;
  userPreferences: number;
  quota: Awaited<ReturnType<typeof checkStorageQuota>>;
}> {
  const db = getOfflineDB();
  
  const [products, orders, syncQueue, userPreferences, quota] = await Promise.all([
    db.products.count(),
    db.orders.count(),
    db.syncQueue.count(),
    db.userPreferences.count(),
    checkStorageQuota(),
  ]);
  
  return {
    products,
    orders,
    syncQueue,
    userPreferences,
    quota,
  };
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = getOfflineDB();
  await Promise.all([
    db.products.clear(),
    db.orders.clear(),
    db.syncQueue.clear(),
    db.userPreferences.clear(),
  ]);
}

/**
 * Clean up old data
 */
export async function cleanupOldData(): Promise<{
  expiredProducts: number;
  syncedOrders: number;
  failedSyncItems: number;
}> {
  const db = getOfflineDB();
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  // Remove expired products
  const expiredProducts = await db.products
    .where('expiresAt')
    .below(now)
    .delete();
  
  // Remove old synced orders (keep for 1 week after sync)
  const syncedOrders = await db.orders
    .filter(order => order.syncStatus === 'synced' && (order.syncedAt || 0) < oneWeekAgo)
    .delete();
  
  // Remove old failed sync items
  const failedSyncItems = await db.syncQueue
    .filter(item => item.status === 'failed' && item.createdAt < oneWeekAgo)
    .delete();
  
  return { expiredProducts, syncedOrders, failedSyncItems };
}

// Export database type
export type HillHaatOfflineDB = HillHaatOfflineDatabase;
