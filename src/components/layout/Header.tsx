'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mountain,
  Menu,
  X,
  Search,
  Bell,
  ShoppingCart,
  ChevronDown,
  Leaf,
  Truck,
  User,
  Package,
  Settings,
  PackageCheck,
  TrendingUp,
  Star,
  Trash2,
  LogOut,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Info,
  ShoppingBag,
  Heart,
  Store,
  Sprout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navigation = [
  { name: 'Home', href: '/', icon: null },
  { name: 'Marketplace', href: '/?section=marketplace', icon: ShoppingBag },
  { name: 'Sell', href: '/?section=sell', icon: Sprout },
  { name: 'Orders', href: '/?section=orders', icon: Package },
  { name: 'Logistics', href: '/?section=logistics', icon: Truck },
];

interface LiveStats {
  platform: {
    totalProducts: number;
    totalFarmers: number;
    totalOrders: number;
    totalRevenue: number;
  };
  user: {
    totalListings: number;
    totalOrders: number;
    buyerOrders: number;
    sellerOrders: number;
    totalRevenue: number;
    totalSpending: number;
    rating: number;
    reviewCount: number;
  } | null;
  notificationCount: number;
  cartCount: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface CartItem {
  id: string;
  quantity: number;
  listing: {
    id: string;
    title: string;
    price: number;
    unit: string;
    images?: string;
    category: string;
  };
}

// API helper
const api = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSignedIn, user, isLoaded } = useUser();

  // Handle search submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?section=marketplace&search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  }, [searchQuery, router]);

  // Live data state
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);

  // Fetch live stats
  const fetchLiveStats = useCallback(async () => {
    try {
      const response = await api('/api/stats');
      setLiveStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingNotifications(true);
    try {
      const response = await api('/api/notifications?limit=5');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [isSignedIn]);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingCart(true);
    try {
      const response = await api('/api/cart?limit=3');
      setCartItems(response.data || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoadingCart(false);
    }
  }, [isSignedIn]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchLiveStats();
    fetchNotifications();
    fetchCartItems();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchLiveStats();
      if (isSignedIn) {
        fetchNotifications();
        fetchCartItems();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLiveStats, fetchNotifications, fetchCartItems, isSignedIn]);

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      await api('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId }),
      });
      fetchNotifications();
      fetchLiveStats();
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await api('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllAsRead: true }),
      });
      fetchNotifications();
      fetchLiveStats();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'PAYMENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DELIVERY':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'REVIEW':
        return <Star className="h-4 w-4 text-amber-500" />;
      case 'SYSTEM':
        return <Info className="h-4 w-4 text-slate-500" />;
      default:
        return <Bell className="h-4 w-4 text-emerald-500" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar with Live Stats */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white text-sm py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-emerald-100">Live</span>
            </span>
            {loadingStats ? (
              <Skeleton className="h-4 w-32 bg-emerald-800/50" />
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  <span>{liveStats?.platform.totalFarmers || 0} Farmers</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  <span>{liveStats?.platform.totalProducts || 0} Products</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>₹{(liveStats?.platform.totalRevenue || 0).toLocaleString()} Revenue</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5" />
              100% Verified
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Pan-India Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 mr-4">
            <div className="relative">
              <Mountain className="h-9 w-9 text-emerald-600 transition-transform group-hover:scale-110" />
              <Leaf className="h-4 w-4 text-emerald-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                Hill-Haat
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
                Farm to Highway
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href.includes('section=') && typeof window !== 'undefined' &&
                 window.location.search.includes(item.href.split('=')[1]));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-lg mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              <Input
                type="search"
                placeholder="Search products, farmers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">Search for "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
                    <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      Search
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {isSignedIn && liveStats?.notificationCount ? (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500 animate-pulse">
                      {liveStats.notificationCount > 9 ? '9+' : liveStats.notificationCount}
                    </Badge>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {isSignedIn ? (
                  <>
                    <div className="flex items-center justify-between p-4 border-b">
                      <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                      {liveStats?.notificationCount ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto py-1 px-2"
                          onClick={markAllNotificationsRead}
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Mark all read
                        </Button>
                      ) : null}
                    </div>
                    <ScrollArea className="h-80">
                      {loadingNotifications ? (
                        <div className="p-4 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                                !notification.isRead && 'bg-emerald-50/50'
                              )}
                              onClick={() => markNotificationRead(notification.id)}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{notification.title}</p>
                                    {!notification.isRead && (
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(notification.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-2 border-t">
                      <Link href="/?section=notifications">
                        <Button variant="ghost" className="w-full text-sm">
                          View all notifications
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-2">Stay Updated</p>
                    <p className="text-xs text-muted-foreground mb-4">Sign in to see your notifications</p>
                    <SignInButton mode="modal">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Sign In</Button>
                    </SignInButton>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {isSignedIn && liveStats?.cartCount ? (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-emerald-500">
                      {liveStats.cartCount > 9 ? '9+' : liveStats.cartCount}
                    </Badge>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {isSignedIn ? (
                  <>
                    <div className="flex items-center justify-between p-4 border-b">
                      <DropdownMenuLabel className="p-0">Your Cart</DropdownMenuLabel>
                      {liveStats?.cartCount ? (
                        <Badge variant="secondary">{liveStats.cartCount} items</Badge>
                      ) : null}
                    </div>
                    <ScrollArea className="h-64">
                      {loadingCart ? (
                        <div className="p-4 space-y-3">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-16 w-16 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : cartItems.length > 0 ? (
                        <div className="divide-y">
                          {cartItems.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex gap-3">
                                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.listing.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} {item.listing.unit}
                                  </p>
                                  <p className="text-sm font-semibold text-emerald-600 mt-1">
                                    ₹{(item.listing.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Your cart is empty</p>
                          <Link href="/?section=marketplace">
                            <Button variant="outline" size="sm" className="mt-3">
                              Start Shopping
                            </Button>
                          </Link>
                        </div>
                      )}
                    </ScrollArea>
                    {cartItems.length > 0 && (
                      <div className="p-4 border-t bg-muted/30">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        <Link href="/?section=marketplace" className="block">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Proceed to Checkout
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-2">Your Cart</p>
                    <p className="text-xs text-muted-foreground mb-4">Sign in to view your cart and start shopping</p>
                    <div className="flex flex-col gap-2">
                      <SignInButton mode="modal">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">Sign In</Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button variant="outline">Create Account</Button>
                      </SignUpButton>
                    </div>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth Section */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center gap-2">
                    {/* User Stats Quick View */}
                    {liveStats?.user && (
                      <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Orders</p>
                          <p className="font-semibold text-sm">{liveStats.user.totalOrders}</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        {liveStats.user.totalRevenue > 0 && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Revenue</p>
                              <p className="font-semibold text-sm text-emerald-600">₹{liveStats.user.totalRevenue.toLocaleString()}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                          </>
                        )}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Rating</p>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {liveStats.user.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-2">
                          <Avatar className="h-8 w-8 border-2 border-emerald-200">
                            <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm">
                              {user.fullName ? getInitials(user.fullName) : <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium leading-none">{user.firstName || 'Account'}</p>
                            {liveStats?.user?.rating && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {liveStats.user.rating.toFixed(1)}
                              </p>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 hidden sm:block" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{user.fullName}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {user.primaryEmailAddress?.emailAddress}
                            </span>
                            {liveStats?.user && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {liveStats.user.totalListings} Listings
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {liveStats.user.totalOrders} Orders
                                </Badge>
                              </div>
                            )}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/?section=profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/?section=orders" className="flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            My Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/?section=sell" className="flex items-center">
                            <Store className="mr-2 h-4 w-4" />
                            My Listings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/?section=wishlist" className="flex items-center">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/?section=settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden pb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, farmers..."
                  className="pl-10 pr-4 h-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t bg-background"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {/* Live Stats for Mobile */}
              {isSignedIn && liveStats?.user && (
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{liveStats.user.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{liveStats.user.totalListings}</p>
                    <p className="text-xs text-muted-foreground">Listings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {liveStats.user.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              )}
              
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              {isLoaded && !isSignedIn && (
                <div className="pt-4 border-t space-y-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// CheckCircle component for notifications
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
