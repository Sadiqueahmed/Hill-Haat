'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// Types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'FARMER' | 'BUYER' | 'LOGISTICS' | 'ADMIN';
  businessName?: string;
  description?: string;
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
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity?: number;
  quality: string;
  isOrganic: boolean;
  isVerified: boolean;
  district: string;
  state: string;
  harvestDate?: string;
  images?: string;
  viewCount: number;
  orderCount: number;
  status: string;
  createdAt: string;
  seller: User;
  avgRating?: number;
  reviewCount?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  deliveryPhone: string;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  listing: Listing;
  buyer: User;
  seller: User;
  delivery?: Delivery;
  tracking: TrackingEvent[];
}

export interface Delivery {
  id: string;
  status: string;
  pickupLocation: string;
  dropLocation: string;
  estimatedTime?: number;
  terrainType: string;
  rider?: User;
}

export interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description: string;
  timestamp: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  listing: Listing;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// API helper
async function api(endpoint: string, options?: RequestInit) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// User sync hook
export function useUserSync() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded) return;
      
      if (isSignedIn && user) {
        try {
          const response = await api('/api/users/sync', {
            method: 'POST',
            body: JSON.stringify({
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName || 'User',
              avatar: user.imageUrl,
            }),
          });
          setDbUser(response.user);
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
      setLoading(false);
    }
    
    syncUser();
  }, [isSignedIn, user, isLoaded]);

  return { dbUser, loading, setDbUser };
}

// Listings hook
export function useListings(filters?: {
  category?: string;
  state?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  isOrganic?: boolean;
  sortBy?: string;
  limit?: number;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.state) params.set('state', filters.state);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.minPrice) params.set('minPrice', filters.minPrice);
      if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters?.isOrganic) params.set('isOrganic', 'true');
      if (filters?.sortBy) params.set('sortBy', filters.sortBy);
      if (filters?.limit) params.set('limit', filters.limit.toString());

      const response = await api(`/api/listings?${params.toString()}`);
      setListings(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.state, filters?.search, filters?.minPrice, filters?.maxPrice, filters?.isOrganic, filters?.sortBy, filters?.limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, pagination, refetch: fetchListings };
}

// Single listing hook
export function useListing(id: string | null) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }

    async function fetchListing() {
      setLoading(true);
      try {
        const response = await api(`/api/listings/${id}`);
        setListing(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listing');
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  return { listing, loading, error };
}

// Orders hook
export function useOrders(role: 'buyer' | 'seller' = 'buyer') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api(`/api/orders?role=${role}`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

// Single order hook
export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      setLoading(true);
      try {
        const response = await api(`/api/orders/${id}`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  return { order, loading, error };
}

// Cart hook
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, deliveryFee: 0, total: 0 });

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/api/cart');
      setItems(response.data);
      setSummary(response.summary);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (listingId: string, quantity: number = 1) => {
    const response = await api('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ listingId, quantity }),
    });
    await fetchCart();
    return response;
  };

  const updateQuantity = async (listingId: string, quantity: number) => {
    await api('/api/cart', {
      method: 'PATCH',
      body: JSON.stringify({ listingId, quantity }),
    });
    await fetchCart();
  };

  const removeFromCart = async (listingId: string) => {
    await api(`/api/cart?listingId=${listingId}`, { method: 'DELETE' });
    await fetchCart();
  };

  const clearCart = async () => {
    await api('/api/cart', { method: 'DELETE' });
    await fetchCart();
  };

  return { items, loading, summary, addToCart, updateQuantity, removeFromCart, clearCart, refetch: fetchCart };
}

// Notifications hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId?: string) => {
    await api('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify(notificationId ? { notificationId } : { markAllAsRead: true }),
    });
    await fetchNotifications();
  };

  return { notifications, unreadCount, loading, markAsRead, refetch: fetchNotifications };
}

// Create listing mutation
export function useCreateListing() {
  const create = async (data: Record<string, unknown>) => {
    return api('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return { create };
}

// Create order mutation
export function useCreateOrder() {
  const create = async (data: Record<string, unknown>) => {
    return api('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return { create };
}

// Update order mutation
export function useUpdateOrder() {
  const update = async (id: string, data: Record<string, unknown>) => {
    return api(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  };

  return { update };
}
