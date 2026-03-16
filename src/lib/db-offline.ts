import Dexie, { type EntityTable } from 'dexie';
import type { 
  Category, 
  QualityGrade, 
  ListingStatus, 
  OrderStatus, 
  PaymentStatus,
  UserRole 
} from '@/types';

// Offline Listing type (for cache)
export interface OfflineListing {
  id: string;
  title: string;
  description: string;
  category: Category;
  subcategory?: string;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity?: number;
  quality: QualityGrade;
  isOrganic: boolean;
  organicCertHash?: string;
  isVerified: boolean;
  district: string;
  state: string;
  coordinates?: string;
  status: ListingStatus;
  availableFrom?: string;
  availableUntil?: string;
  harvestDate?: string;
  images?: string[];
  viewCount: number;
  orderCount: number;
  createdAt: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  cachedAt: number; // Timestamp when cached
  dirty: boolean; // Whether local changes need sync
}

// Offline Order type (for queue)
export interface OfflineOrder {
  id: string;
  tempId: string; // Temporary ID for offline orders
  orderNumber?: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  notes?: string;
  createdAt: string;
  syncedAt?: string;
  dirty: boolean;
  syncAttempts: number;
  lastSyncError?: string;
}

// Offline Cart item
export interface OfflineCartItem {
  id: string;
  listingId: string;
  userId: string;
  quantity: number;
  unitPrice: number;
  addedAt: number;
  updatedAt: number;
  dirty: boolean;
  // Cached listing info
  listingTitle: string;
  listingImage?: string;
  listingUnit: string;
  sellerName: string;
  availableQuantity?: number;
}

// Offline User type (for cache)
export interface OfflineUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  district?: string;
  state?: string;
  address?: string;
  pincode?: string;
  isVerified: boolean;
  totalSales: number;
  totalPurchases: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  cachedAt: number;
  dirty: boolean;
}

// Sync Queue item
export interface SyncQueueItem {
  id: string;
  entityType: 'listing' | 'order' | 'cart' | 'user' | 'notification';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  priority: number; // Higher = more critical (orders > listings > views)
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  lastError?: string;
  createdAt: number;
  nextRetryAt?: number;
}

// Offline Notification
export interface OfflineNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  syncedAt?: string;
  dirty: boolean;
}

// Priority constants for sync operations
export const SYNC_PRIORITIES = {
  ORDER: 100,      // Highest - orders are critical
  CART: 80,        // High - cart affects user experience
  LISTING: 60,     // Medium - product data
  USER: 40,        // Lower - user profile updates
  NOTIFICATION: 20, // Lowest - can be delayed
  VIEW: 10,        // Lowest - analytics
} as const;

// Database class
class HillHaatDatabase extends Dexie {
  listings!: EntityTable<OfflineListing, 'id'>;
  orders!: EntityTable<OfflineOrder, 'id'>;
  cart!: EntityTable<OfflineCartItem, 'id'>;
  users!: EntityTable<OfflineUser, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  notifications!: EntityTable<OfflineNotification, 'id'>;

  constructor() {
    super('HillHaatOfflineDB');
    
    this.version(1).stores({
      listings: 'id, category, district, state, status, sellerId, cachedAt, dirty',
      orders: 'id, tempId, buyerId, sellerId, listingId, status, createdAt, dirty, syncAttempts',
      cart: 'id, listingId, userId, dirty',
      users: 'id, email, role, cachedAt, dirty',
      syncQueue: 'id, entityType, entityId, operation, priority, createdAt, nextRetryAt',
      notifications: 'id, userId, type, isRead, createdAt, dirty',
    });
  }
}

// Database singleton
let dbInstance: HillHaatDatabase | null = null;

export function getOfflineDB(): HillHaatDatabase {
  if (!dbInstance) {
    dbInstance = new HillHaatDatabase();
  }
  return dbInstance;
}

export const offlineDB = getOfflineDB();

// Helper functions for quota management
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
  // Fallback for browsers without Storage API
  return {
    usage: 0,
    quota: Infinity,
    available: Infinity,
    percentageUsed: 0,
  };
}

export async function clearOldData(): Promise<void> {
  const db = getOfflineDB();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  // Clear old cached listings (not dirty)
  await db.listings
    .where('cachedAt')
    .below(oneWeekAgo)
    .filter(listing => !listing.dirty)
    .delete();
  
  // Clear old synced orders
  await db.orders
    .filter(order => !order.dirty && order.syncedAt && new Date(order.syncedAt).getTime() < oneWeekAgo)
    .delete();
  
  // Clear old read notifications
  await db.notifications
    .filter(notification => notification.isRead && !notification.dirty)
    .delete();
}

export async function getStorageStats(): Promise<{
  listings: number;
  orders: number;
  cartItems: number;
  users: number;
  pendingSync: number;
  notifications: number;
  quota: ReturnType<typeof checkStorageQuota> extends Promise<infer T> ? T : never;
}> {
  const db = getOfflineDB();
  
  const [listings, orders, cartItems, users, pendingSync, notifications, quota] = await Promise.all([
    db.listings.count(),
    db.orders.count(),
    db.cart.count(),
    db.users.count(),
    db.syncQueue.count(),
    db.notifications.count(),
    checkStorageQuota(),
  ]);
  
  return {
    listings,
    orders,
    cartItems,
    users,
    pendingSync,
    notifications,
    quota,
  };
}

// Export types for use in other modules
export type HillHaatDB = HillHaatDatabase;
