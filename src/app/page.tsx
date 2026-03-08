'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  ArrowRight, TrendingUp, Package, MapPin, Phone, MessageSquare, Truck,
  Mountain, Upload, Leaf, DollarSign, Calendar, Info, X, CheckCircle,
  User, Bell, Shield, Edit, Camera, Award, Settings, Star, Grid3X3,
  List, Search, SlidersHorizontal, Clock, ShoppingBag, Heart, Share2,
  Filter, ChevronDown, ChevronRight, Plus, Minus, Trash2, Store,
  TruckIcon, Navigation, AlertTriangle, Check, Eye, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATEGORY_LABELS, QUALITY_LABELS, NE_STATES, NE_DISTRICTS, ORDER_STATUS_LABELS } from '@/types';
import { HomeSection } from '@/components/sections/HomeSection';
import { LogisticsSection } from '@/components/sections/LogisticsSection';

// Types
type Category = keyof typeof CATEGORY_LABELS;
type QualityGrade = keyof typeof QUALITY_LABELS;
type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

interface User {
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
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity?: number;
  quality: QualityGrade;
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
}

interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
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

interface Delivery {
  id: string;
  status: string;
  pickupLocation: string;
  dropLocation: string;
  estimatedTime?: number;
  terrainType: string;
  rider?: User;
}

interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description: string;
  timestamp: string;
}

interface CartItem {
  id: string;
  quantity: number;
  listing: Listing;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer: User;
  createdAt: string;
  isVerified: boolean;
}

// API helper
const api = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

// Listing Form Schema
const listingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  description: z.string().min(30, 'Description must be at least 30 characters').max(2000),
  category: z.enum(['VEGETABLES', 'FRUITS', 'SPICES', 'GRAINS', 'DAIRY', 'HERBS', 'BAMBOO_PRODUCTS', 'HANDICRAFTS', 'TEA', 'HONEY', 'OTHER'] as const),
  quality: z.enum(['A_PLUS', 'A', 'B', 'C'] as const),
  price: z.number().min(1, 'Price must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  minOrder: z.number().min(0.1, 'Minimum order must be at least 0.1'),
  maxQuantity: z.number().optional(),
  isOrganic: z.boolean(),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  harvestDate: z.string().optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

// Order Form Schema
const orderSchema = z.object({
  quantity: z.number().min(0.1, 'Quantity is required'),
  deliveryAddress: z.string().min(10, 'Address is required'),
  deliveryDistrict: z.string().min(1, 'District is required'),
  deliveryState: z.string().min(1, 'State is required'),
  deliveryPincode: z.string().min(6, 'Valid pincode is required'),
  deliveryPhone: z.string().min(10, 'Valid phone number is required'),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// Main Content Component (wrapped in Suspense)
function HomePageContent() {
  // Auth state
  const { isSignedIn, user: clerkUser, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // UI state
  const [activeSection, setActiveSection] = useState('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Data state
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState({ itemCount: 0, subtotal: 0, deliveryFee: 0, total: 0 });
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [showOrganicOnly, setShowOrganicOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  
  // Loading states
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // Form setup
  const listingForm = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '', description: '', category: 'VEGETABLES', quality: 'A',
      price: 0, unit: 'kg', minOrder: 1, isOrganic: false,
    },
  });

  const orderForm = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1, deliveryAddress: '', deliveryDistrict: '', 
      deliveryState: '', deliveryPincode: '', deliveryPhone: '',
    },
  });

  const formState = listingForm.watch('state');
  const districts = formState ? NE_DISTRICTS[formState] || [] : [];

  // Sync user with database
  useEffect(() => {
    async function syncUser() {
      if (!isLoaded) return;
      if (isSignedIn && clerkUser) {
        try {
          const response = await api('/api/users/sync', {
            method: 'POST',
            body: JSON.stringify({
              email: clerkUser.primaryEmailAddress?.emailAddress,
              name: clerkUser.fullName || clerkUser.firstName || 'User',
              avatar: clerkUser.imageUrl,
            }),
          });
          setDbUser(response.user);
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
      setLoadingUser(false);
    }
    syncUser();
  }, [isSignedIn, clerkUser, isLoaded]);

  // Sync activeSection with URL params
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['home', 'marketplace', 'sell', 'orders', 'profile', 'logistics', 'wishlist', 'settings', 'notifications'].includes(section)) {
      setActiveSection(section);
    }
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Update URL when section changes
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set('section', section);
    router.replace(url.pathname + url.search);
  }, [router]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) params.set('category', selectedCategories[0]);
      if (selectedStates.length > 0) params.set('state', selectedStates[0]);
      if (searchQuery) params.set('search', searchQuery);
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < 2000) params.set('maxPrice', priceRange[1].toString());
      if (showOrganicOnly) params.set('isOrganic', 'true');
      if (showVerifiedOnly) params.set('isVerified', 'true');
      params.set('sortBy', sortBy);

      const response = await api(`/api/listings?${params.toString()}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoadingListings(false);
    }
  }, [selectedCategories, selectedStates, searchQuery, priceRange, showOrganicOnly, showVerifiedOnly, sortBy]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Fetch user's listings
  const fetchMyListings = useCallback(async () => {
    if (!dbUser) return;
    try {
      const response = await api(`/api/listings?sellerId=${dbUser.id}&limit=50`);
      setMyListings(response.data);
    } catch (error) {
      console.error('Failed to fetch my listings:', error);
    }
  }, [dbUser]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!dbUser) return;
    try {
      const [buyerRes, sellerRes] = await Promise.all([
        api('/api/orders?role=buyer&limit=50'),
        api('/api/orders?role=seller&limit=50'),
      ]);
      setOrders(buyerRes.data);
      setSellerOrders(sellerRes.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [dbUser]);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await api('/api/cart');
      setCart(response.data);
      setCartSummary(response.summary);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchCart();
      fetchOrders();
      fetchMyListings();
    }
  }, [isSignedIn, fetchCart, fetchOrders, fetchMyListings]);

  // Filter listings on client side for multiple selections
  const filteredListings = useMemo(() => {
    let filtered = [...listings];
    
    if (selectedCategories.length > 1) {
      filtered = filtered.filter(l => selectedCategories.includes(l.category));
    }
    if (selectedStates.length > 1) {
      filtered = filtered.filter(l => selectedStates.includes(l.state));
    }
    
    return filtered;
  }, [listings, selectedCategories, selectedStates]);

  // Handlers
  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStates([]);
    setPriceRange([0, 2000]);
    setShowOrganicOnly(false);
    setShowVerifiedOnly(false);
    setSearchQuery('');
  };

  const activeFiltersCount = selectedCategories.length + selectedStates.length + (showOrganicOnly ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  // Create listing
  const onCreateListing = async (data: ListingFormData) => {
    setSubmitting(true);
    try {
      await api('/api/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Listing created successfully!');
      listingForm.reset();
      fetchMyListings();
      fetchListings();
      setActiveSection('orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  // Add to cart
  const addToCart = async (listingId: string, quantity: number = 1) => {
    if (!isSignedIn) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    try {
      await api('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ listingId, quantity }),
      });
      toast.success('Added to cart!');
      fetchCart();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add to cart';
      toast.error(message);
    }
  };

  // Update cart quantity
  const updateCartQuantity = async (listingId: string, quantity: number) => {
    try {
      await api('/api/cart', {
        method: 'PATCH',
        body: JSON.stringify({ listingId, quantity }),
      });
      fetchCart();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update cart';
      toast.error(message);
    }
  };

  // Remove from cart
  const removeFromCart = async (listingId: string) => {
    try {
      await api(`/api/cart?listingId=${listingId}`, { method: 'DELETE' });
      toast.success('Removed from cart');
      fetchCart();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove item';
      toast.error(message);
    }
  };

  // Create order
  const onCreateOrder = async (data: OrderFormData) => {
    if (!selectedListing) return;
    setSubmitting(true);
    try {
      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          listingId: selectedListing.id,
          quantity: data.quantity,
          ...data,
        }),
      });
      toast.success('Order placed successfully!');
      setShowOrderModal(false);
      orderForm.reset();
      fetchOrders();
      fetchCart();
      setActiveSection('orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api(`/api/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  // Track order
  const trackOrder = async () => {
    if (!trackingId.trim()) return;
    try {
      const response = await api(`/api/orders/${trackingId}`);
      setTrackedOrder(response.data);
    } catch (error) {
      toast.error('Order not found');
      setTrackedOrder(null);
    }
  };

  // Open order modal
  const openOrderModal = (listing: Listing) => {
    if (!isSignedIn) {
      toast.error('Please sign in to place an order');
      return;
    }
    setSelectedListing(listing);
    orderForm.setValue('quantity', listing.minOrder);
    if (dbUser) {
      orderForm.setValue('deliveryAddress', dbUser.address || '');
      orderForm.setValue('deliveryDistrict', dbUser.district || '');
      orderForm.setValue('deliveryState', dbUser.state || '');
      orderForm.setValue('deliveryPincode', dbUser.pincode || '');
      orderForm.setValue('deliveryPhone', dbUser.phone || '');
    }
    setShowOrderModal(true);
  };

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    listings.forEach(l => {
      stats[l.category] = (stats[l.category] || 0) + 1;
    });
    return Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
      category: category as Category,
      label,
      count: stats[category] || 0,
    }));
  }, [listings]);

  // Calculate order total for modal
  const orderTotal = useMemo(() => {
    if (!selectedListing) return 0;
    return selectedListing.price * (orderForm.watch('quantity') || 1);
  }, [selectedListing, orderForm]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Pills */}
      <div className="sticky top-[73px] z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'home', label: 'Home', icon: null },
              { id: 'marketplace', label: 'Marketplace', icon: null },
              { id: 'orders', label: 'My Orders', icon: null },
              { id: 'sell', label: 'Sell Products', icon: null },
              { id: 'logistics', label: 'Logistics', icon: null },
              { id: 'profile', label: 'Profile', icon: null },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSectionChange(item.id)}
                className={cn(
                  'whitespace-nowrap',
                  activeSection === item.id && 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* HOME SECTION */}
        {activeSection === 'home' && (
          <HomeSection onNavigate={handleSectionChange} />
        )}

        {/* MARKETPLACE SECTION */}
        {activeSection === 'marketplace' && (
          <motion.div
            key="marketplace"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 py-6"
          >
            <div className="container mx-auto px-4">
              {/* Search and Filters Header */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products, farmers, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-slate-50 border-0"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px] h-11 bg-slate-50 border-0">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Newest First</SelectItem>
                        <SelectItem value="price">Price: Low to High</SelectItem>
                        <SelectItem value="price:desc">Price: High to Low</SelectItem>
                        <SelectItem value="viewCount">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden h-11 gap-2">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filters
                          {activeFiltersCount > 0 && (
                            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                          <SheetDescription>Refine your search results</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                          <FilterContent
                            selectedCategories={selectedCategories}
                            selectedStates={selectedStates}
                            priceRange={priceRange}
                            showOrganicOnly={showOrganicOnly}
                            showVerifiedOnly={showVerifiedOnly}
                            onToggleCategory={toggleCategory}
                            onToggleState={toggleState}
                            onPriceChange={setPriceRange}
                            onToggleOrganic={setShowOrganicOnly}
                            onToggleVerified={setShowVerifiedOnly}
                            onClearFilters={clearFilters}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>

                    <div className="hidden sm:flex border rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="icon"
                        className={cn('rounded-none h-11 w-11', viewMode === 'grid' && 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="icon"
                        className={cn('rounded-none h-11 w-11', viewMode === 'list' && 'bg-emerald-600 hover:bg-emerald-700')}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="gap-1">
                        {CATEGORY_LABELS[cat]}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(cat)} />
                      </Badge>
                    ))}
                    {selectedStates.map((state) => (
                      <Badge key={state} variant="secondary" className="gap-1">
                        {state}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleState(state)} />
                      </Badge>
                    ))}
                    {showOrganicOnly && (
                      <Badge variant="secondary" className="gap-1">
                        Organic
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setShowOrganicOnly(false)} />
                      </Badge>
                    )}
                    {showVerifiedOnly && (
                      <Badge variant="secondary" className="gap-1">
                        Verified
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setShowVerifiedOnly(false)} />
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-6">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0">
                  <Card className="sticky top-[140px] border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Filters</h3>
                      <FilterContent
                        selectedCategories={selectedCategories}
                        selectedStates={selectedStates}
                        priceRange={priceRange}
                        showOrganicOnly={showOrganicOnly}
                        showVerifiedOnly={showVerifiedOnly}
                        onToggleCategory={toggleCategory}
                        onToggleState={toggleState}
                        onPriceChange={setPriceRange}
                        onToggleOrganic={setShowOrganicOnly}
                        onToggleVerified={setShowVerifiedOnly}
                        onClearFilters={clearFilters}
                      />
                    </CardContent>
                  </Card>
                </aside>

                {/* Products Grid */}
                <main className="flex-1">
                  <p className="text-muted-foreground mb-6">
                    Showing <span className="font-medium text-foreground">{filteredListings.length}</span> products
                  </p>
                  
                  {loadingListings ? (
                    <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                          <CardContent className="p-4">
                            <Skeleton className="h-48 w-full mb-4" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-10 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredListings.length > 0 ? (
                    <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                      {filteredListings.map((listing, index) => (
                        <ProductCard
                          key={listing.id}
                          listing={listing}
                          index={index}
                          viewMode={viewMode}
                          onAddToCart={addToCart}
                          onOrder={() => openOrderModal(listing)}
                          onView={() => {
                            setSelectedListing(listing);
                            setShowListingModal(true);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2">No products found</h3>
                        <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                        <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
                      </CardContent>
                    </Card>
                  )}
                </main>
              </div>
            </div>
          </motion.div>
        )}

        {/* SELL SECTION */}
        {activeSection === 'sell' && (
          <motion.div
            key="sell"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 py-8"
          >
            <div className="container mx-auto px-4">
              {!isSignedIn ? (
                <Card className="max-w-md mx-auto border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                      <Store className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Start Selling Today</h3>
                    <p className="text-muted-foreground mb-6">Sign in to list your products and connect with buyers across India</p>
                    <div className="flex flex-col gap-3">
                      <SignUpButton mode="modal">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          Create Seller Account
                        </Button>
                      </SignUpButton>
                      <SignInButton mode="modal">
                        <Button variant="outline">Sign In</Button>
                      </SignInButton>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold mb-2">List Your Product</h1>
                      <p className="text-muted-foreground">Connect with buyers across India. Sell your fresh produce directly from your farm.</p>
                    </div>

                    <Tabs defaultValue="create">
                      <TabsList className="mb-6">
                        <TabsTrigger value="create">Create New Listing</TabsTrigger>
                        <TabsTrigger value="my-listings">My Listings ({myListings.length})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="create">
                        <Form {...listingForm}>
                          <form onSubmit={listingForm.handleSubmit(onCreateListing)} className="space-y-6">
                            {/* Basic Information */}
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Package className="h-5 w-5 text-emerald-600" />
                                  Basic Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <FormField
                                  control={listingForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Product Title *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Organic Ginger - Fresh from Jampui Hills" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={listingForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description *</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Describe your product in detail - origin, quality, harvest method, etc." className="min-h-32" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={listingForm.control}
                                    name="category"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                              <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={listingForm.control}
                                    name="quality"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Quality Grade *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select quality" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {Object.entries(QUALITY_LABELS).map(([key, label]) => (
                                              <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Pricing & Quantity */}
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-emerald-600" />
                                  Pricing & Quantity
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-3 gap-4">
                                  <FormField
                                    control={listingForm.control}
                                    name="price"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Price (₹) *</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={listingForm.control}
                                    name="unit"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Unit *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                            <SelectItem value="g">Gram (g)</SelectItem>
                                            <SelectItem value="piece">Piece</SelectItem>
                                            <SelectItem value="bundle">Bundle</SelectItem>
                                            <SelectItem value="litre">Litre</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={listingForm.control}
                                    name="minOrder"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Min. Order *</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Location */}
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5 text-emerald-600" />
                                  Location Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={listingForm.control}
                                    name="state"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>State *</FormLabel>
                                        <Select
                                          onValueChange={(value) => {
                                            field.onChange(value);
                                            listingForm.setValue('district', '');
                                          }}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {NE_STATES.map((state) => (
                                              <SelectItem key={state} value={state}>{state}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={listingForm.control}
                                    name="district"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>District *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!formState}>
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder={formState ? "Select district" : "Select state first"} /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {districts.map((district) => (
                                              <SelectItem key={district} value={district}>{district}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Certification */}
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Leaf className="h-5 w-5 text-emerald-600" />
                                  Certification & Quality
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                                  <div>
                                    <FormLabel className="text-base">Organic Product</FormLabel>
                                    <FormDescription>Mark if your product is grown organically</FormDescription>
                                  </div>
                                  <FormField
                                    control={listingForm.control}
                                    name="isOrganic"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            <div className="flex gap-4">
                              <Button type="button" variant="outline" size="lg" className="flex-1">Save as Draft</Button>
                              <Button type="submit" size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                                {submitting ? 'Publishing...' : 'Publish Listing'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </TabsContent>

                      <TabsContent value="my-listings">
                        {myListings.length === 0 ? (
                          <Card className="border-0 shadow-md">
                            <CardContent className="p-12 text-center">
                              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                              <p className="text-muted-foreground mb-4">Create your first listing to start selling</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {myListings.map((listing) => (
                              <Card key={listing.id} className="border-0 shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{listing.title}</h3>
                                    <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                      {listing.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{listing.district}, {listing.state}</p>
                                  <div className="flex justify-between items-center">
                                    <p className="font-bold text-emerald-600">₹{listing.price}/{listing.unit}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Eye className="h-4 w-4" /> {listing.viewCount}
                                      <ShoppingBag className="h-4 w-4" /> {listing.orderCount}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Sidebar Tips */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-md sticky top-24">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-emerald-600" />
                          Listing Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { title: 'Clear Title', desc: 'Include product name, quality, and origin' },
                          { title: 'Detailed Description', desc: 'Mention growing conditions, harvest methods' },
                          { title: 'Quality Photos', desc: 'Clear images increase buyer trust' },
                          { title: 'Competitive Pricing', desc: 'Research similar products for fair pricing' },
                        ].map((tip, i) => (
                          <div key={i} className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{tip.title}</p>
                              <p className="text-xs text-muted-foreground">{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ORDERS SECTION */}
        {activeSection === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 py-8"
          >
            <div className="container mx-auto px-4">
              {!isSignedIn ? (
                <Card className="max-w-md mx-auto border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                      <Package className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">View Your Orders</h3>
                    <p className="text-muted-foreground mb-6">Sign in to view your orders and track deliveries</p>
                    <SignInButton mode="modal">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Sign In</Button>
                    </SignInButton>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Orders</h1>
                    <p className="text-muted-foreground">Manage your purchases and sales</p>
                  </div>

                  <Tabs defaultValue="buyer">
                    <TabsList className="mb-6">
                      <TabsTrigger value="buyer">My Purchases ({orders.length})</TabsTrigger>
                      <TabsTrigger value="seller">My Sales ({sellerOrders.length})</TabsTrigger>
                      <TabsTrigger value="track">Track Order</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buyer">
                      {orders.length === 0 ? (
                        <Card className="border-0 shadow-md">
                          <CardContent className="p-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                            <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                            <Button onClick={() => setActiveSection('marketplace')} className="bg-emerald-600 hover:bg-emerald-700">
                              Browse Marketplace
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              onView={() => {
                                setSelectedOrder(order);
                                setShowListingModal(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="seller">
                      {sellerOrders.length === 0 ? (
                        <Card className="border-0 shadow-md">
                          <CardContent className="p-12 text-center">
                            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No sales yet</h3>
                            <p className="text-muted-foreground mb-4">List products to start receiving orders</p>
                            <Button onClick={() => setActiveSection('sell')} className="bg-emerald-600 hover:bg-emerald-700">
                              Create Listing
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {sellerOrders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              isSeller
                              onUpdateStatus={updateOrderStatus}
                              onView={() => {
                                setSelectedOrder(order);
                                setShowListingModal(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="track">
                      <Card className="border-0 shadow-md max-w-xl mx-auto">
                        <CardHeader>
                          <CardTitle>Track Your Order</CardTitle>
                          <CardDescription>Enter your order ID to track your shipment</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter order ID"
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                            />
                            <Button onClick={trackOrder} className="bg-emerald-600 hover:bg-emerald-700">
                              <Search className="h-4 w-4 mr-2" />
                              Track
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {trackedOrder && (
                        <Card className="border-0 shadow-md max-w-xl mx-auto mt-6">
                          <CardContent className="p-6">
                            <OrderTracking order={trackedOrder} />
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* PROFILE SECTION */}
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 py-8"
          >
            <div className="container mx-auto px-4">
              {!isSignedIn ? (
                <Card className="max-w-md mx-auto border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                      <User className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
                    <p className="text-muted-foreground mb-6">Sign in to view and manage your profile</p>
                    <SignInButton mode="modal">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Sign In</Button>
                    </SignInButton>
                  </CardContent>
                </Card>
              ) : dbUser ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={dbUser.avatar} />
                            <AvatarFallback className="text-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                              {dbUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="text-xl font-bold">{dbUser.name}</h2>
                            <p className="text-muted-foreground">{dbUser.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{dbUser.role}</Badge>
                              {dbUser.isVerified && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <Check className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Phone</Label>
                            <p className="font-medium">{dbUser.phone || 'Not set'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Location</Label>
                            <p className="font-medium">
                              {dbUser.district && dbUser.state ? `${dbUser.district}, ${dbUser.state}` : 'Not set'}
                            </p>
                          </div>
                        </div>

                        {dbUser.businessName && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-muted-foreground">Business Name</Label>
                              <p className="font-medium">{dbUser.businessName}</p>
                            </div>
                            {dbUser.description && (
                              <div>
                                <Label className="text-muted-foreground">About</Label>
                                <p className="text-sm">{dbUser.description}</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">{dbUser.totalSales}</p>
                            <p className="text-sm text-muted-foreground">Total Sales</p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{dbUser.totalPurchases}</p>
                            <p className="text-sm text-muted-foreground">Purchases</p>
                          </div>
                          <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-600">{dbUser.rating.toFixed(1)}</p>
                            <p className="text-sm text-muted-foreground">Rating</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{dbUser.reviewCount}</p>
                            <p className="text-sm text-muted-foreground">Reviews</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveSection('sell')}>
                          <Package className="h-4 w-4 mr-2" />
                          My Listings
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveSection('orders')}>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          My Orders
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Account Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* LOGISTICS SECTION */}
        {activeSection === 'logistics' && (
          <LogisticsSection />
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <Dialog open={showListingModal} onOpenChange={setShowListingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedListing.title}</DialogTitle>
                <DialogDescription>
                  {selectedListing.district}, {selectedListing.state}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {selectedListing.isOrganic && (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <Leaf className="h-3 w-3 mr-1" /> Organic
                    </Badge>
                  )}
                  {selectedListing.isVerified && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline">{QUALITY_LABELS[selectedListing.quality]}</Badge>
                </div>

                <p className="text-muted-foreground">{selectedListing.description}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold text-emerald-600">₹{selectedListing.price}/{selectedListing.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Min. Order</p>
                    <p className="font-medium">{selectedListing.minOrder} {selectedListing.unit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={selectedListing.seller.avatar} />
                    <AvatarFallback>{selectedListing.seller.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedListing.seller.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {selectedListing.seller.rating.toFixed(1)} ({selectedListing.seller.reviewCount} reviews)
                    </div>
                  </div>
                  {selectedListing.seller.isVerified && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3 mr-1" /> Verified Seller
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                    setShowListingModal(false);
                    openOrderModal(selectedListing);
                  }}>
                    <ShoppingBag className="h-4 w-4 mr-2" /> Order Now
                  </Button>
                  <Button variant="outline" onClick={() => addToCart(selectedListing.id)}>
                    <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-lg">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle>Place Order</DialogTitle>
                <DialogDescription>{selectedListing.title}</DialogDescription>
              </DialogHeader>

              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit(onCreateOrder)} className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Price</span>
                      <span>₹{selectedListing.price}/{selectedListing.unit}</span>
                    </div>
                    <FormField
                      control={orderForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity ({selectedListing.unit})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={selectedListing.minOrder}
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-emerald-600">₹{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <FormField
                    control={orderForm.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full delivery address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="deliveryState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {NE_STATES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="deliveryDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District *</FormLabel>
                          <FormControl>
                            <Input placeholder="District" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="deliveryPincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode *</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="deliveryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowOrderModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>
              {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
            </SheetDescription>
          </SheetHeader>
          
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button variant="link" onClick={() => {
                setShowCart(false);
                setActiveSection('marketplace');
              }}>
                Browse Products
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {cart.map((item) => (
                    <Card key={item.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.listing.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.listing.seller.name}</p>
                            <p className="font-bold text-emerald-600">₹{item.listing.price}/{item.listing.unit}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(item.listing.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(item.listing.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeFromCart(item.listing.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{cartSummary.deliveryFee === 0 ? 'Free' : `₹${cartSummary.deliveryFee}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{cartSummary.total.toFixed(2)}</span>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  if (cart.length > 0) {
                    openOrderModal(cart[0].listing);
                    setShowCart(false);
                  }
                }}>
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Loading fallback for Suspense
function HomePageLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Pills Skeleton */}
      <div className="sticky top-[73px] z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Hill-Haat...</p>
        </div>
      </div>
    </div>
  );
}

// Default export with Suspense wrapper
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}

// Filter Content Component
function FilterContent({
  selectedCategories,
  selectedStates,
  priceRange,
  showOrganicOnly,
  showVerifiedOnly,
  onToggleCategory,
  onToggleState,
  onPriceChange,
  onToggleOrganic,
  onToggleVerified,
  onClearFilters,
}: {
  selectedCategories: Category[];
  selectedStates: string[];
  priceRange: number[];
  showOrganicOnly: boolean;
  showVerifiedOnly: boolean;
  onToggleCategory: (cat: Category) => void;
  onToggleState: (state: string) => void;
  onPriceChange: (range: number[]) => void;
  onToggleOrganic: (val: boolean) => void;
  onToggleVerified: (val: boolean) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-4">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={selectedCategories.includes(key as Category)}
                  onCheckedChange={() => onToggleCategory(key as Category)}
                />
                <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* States */}
      <div>
        <h4 className="font-medium mb-3">States</h4>
        <ScrollArea className="h-32">
          <div className="space-y-2 pr-4">
            {NE_STATES.map((state) => (
              <div key={state} className="flex items-center space-x-2">
                <Checkbox
                  id={state}
                  checked={selectedStates.includes(state)}
                  onCheckedChange={() => onToggleState(state)}
                />
                <label htmlFor={state} className="text-sm cursor-pointer">{state}</label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-3">Price Range (₹)</h4>
        <Slider
          value={priceRange}
          onValueChange={onPriceChange}
          max={2000}
          step={50}
          className="mt-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}+</span>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Organic Only</span>
          <Switch checked={showOrganicOnly} onCheckedChange={onToggleOrganic} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Verified Sellers</span>
          <Switch checked={showVerifiedOnly} onCheckedChange={onToggleVerified} />
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onClearFilters}>
        Clear All Filters
      </Button>
    </div>
  );
}

// Product Card Component
function ProductCard({
  listing,
  index,
  viewMode = 'grid',
  onAddToCart,
  onOrder,
  onView,
}: {
  listing: Listing;
  index: number;
  viewMode?: 'grid' | 'list';
  onAddToCart: (id: string) => void;
  onOrder: () => void;
  onView: () => void;
}) {
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={onView}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">{listing.district}, {listing.state}</p>
                  </div>
                  <div className="flex gap-1">
                    {listing.isOrganic && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        <Leaf className="h-3 w-3 mr-1" /> Organic
                      </Badge>
                    )}
                    {listing.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{listing.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-emerald-600">₹{listing.price}</span>
                    <span className="text-muted-foreground">/{listing.unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onAddToCart(listing.id); }}>
                      <ShoppingBag className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); onOrder(); }}>
                      Order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group" onClick={onView}>
        <CardContent className="p-4">
          <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <span className="text-4xl">
              {listing.category === 'VEGETABLES' && '🥬'}
              {listing.category === 'FRUITS' && '🍎'}
              {listing.category === 'SPICES' && '🌶️'}
              {listing.category === 'GRAINS' && '🌾'}
              {listing.category === 'TEA' && '🍵'}
              {listing.category === 'HONEY' && '🍯'}
              {listing.category === 'HERBS' && '🌿'}
              {listing.category === 'DAIRY' && '🥛'}
              {listing.category === 'BAMBOO_PRODUCTS' && '🎋'}
              {listing.category === 'HANDICRAFTS' && '🧺'}
              {listing.category === 'OTHER' && '📦'}
            </span>
          </div>

          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[listing.category]}</Badge>
            <div className="flex gap-1">
              {listing.isOrganic && <Leaf className="h-4 w-4 text-emerald-500" />}
              {listing.isVerified && <Check className="h-4 w-4 text-blue-500" />}
            </div>
          </div>

          <h3 className="font-semibold mb-1 line-clamp-1">{listing.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{listing.district}, {listing.state}</p>

          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{listing.seller.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{listing.seller.name}</span>
            {listing.seller.isVerified && (
              <Check className="h-3 w-3 text-blue-500" />
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-emerald-600">₹{listing.price}</span>
              <span className="text-sm text-muted-foreground">/{listing.unit}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{listing.avgRating?.toFixed(1) || listing.seller.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onAddToCart(listing.id); }}>
              <ShoppingBag className="h-4 w-4 mr-1" /> Add
            </Button>
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); onOrder(); }}>
              Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Order Card Component
function OrderCard({
  order,
  isSeller = false,
  onUpdateStatus,
  onView,
}: {
  order: Order;
  isSeller?: boolean;
  onUpdateStatus?: (id: string, status: OrderStatus) => void;
  onView: () => void;
}) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-cyan-100 text-cyan-700',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                <h3 className="font-semibold">{order.listing.title}</h3>
              </div>
              <Badge className={statusColors[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{order.quantity} {order.listing.unit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium text-emerald-600">₹{order.totalPrice}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{isSeller ? 'Buyer' : 'Seller'}</p>
                <p className="font-medium">{isSeller ? order.buyer.name : order.seller.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={onView}>
                <Eye className="h-4 w-4 mr-1" /> View Details
              </Button>
              
              {isSeller && order.status === 'PENDING' && onUpdateStatus && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}>
                  <Check className="h-4 w-4 mr-1" /> Confirm Order
                </Button>
              )}
              
              {isSeller && order.status === 'CONFIRMED' && onUpdateStatus && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onUpdateStatus(order.id, 'SHIPPED')}>
                  <Truck className="h-4 w-4 mr-1" /> Mark Shipped
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Order Tracking Component
function OrderTracking({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Order #{order.orderNumber}</h3>
          <p className="text-sm text-muted-foreground">{order.listing.title}</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700">
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {order.tracking.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center z-10',
                index === 0 ? 'bg-emerald-500' : 'bg-muted'
              )}>
                {index === 0 ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{event.description}</p>
                {event.location && (
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
