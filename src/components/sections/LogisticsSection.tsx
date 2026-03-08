'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  Truck, Package, CheckCircle, Clock, MapPin, User, Phone, Star,
  TrendingUp, DollarSign, Route, Filter, Search, X, Navigation,
  Droplets, WifiOff, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TERRAIN_INFO, NE_STATES, type TerrainType, type VehicleType, VEHICLE_INFO } from '@/types';

// Types
interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  currentLocation?: string;
  currentDistrict?: string;
  currentState?: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  terrainExpertise: TerrainType[];
  isVerified: boolean;
}

interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  pickupLocation: string;
  pickupDistrict?: string;
  pickupState?: string;
  dropLocation: string;
  dropDistrict?: string;
  dropState?: string;
  estimatedDistance?: number;
  estimatedTime?: number;
  terrainType: TerrainType;
  difficultyLevel: number;
  elevationGain?: number;
  currentLocation?: string;
  baseFare: number;
  terrainBonus: number;
  totalEarnings: number;
  weatherMultiplier?: number;
  hazardZones?: string[];
  rider?: Rider;
  listing?: {
    title: string;
    seller: { name: string; phone?: string };
  };
  buyer?: { name: string; phone: string };
  createdAt: string;
  deliveredAt?: string;
}

interface LogisticsDashboard {
  totalPartners: number;
  activePartners: number;
  totalRiders: number;
  availableRiders: number;
  activeDeliveries: number;
  pendingOrders: number;
  completedToday: number;
  totalEarnings: number;
  currentSeason: string;
  weatherMultiplier: number;
  shadowZones: number;
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

// Terrain colors
const terrainColors: Record<TerrainType, string> = {
  PLAIN: 'bg-green-100 text-green-800 border-green-200',
  HILLY: 'bg-amber-100 text-amber-800 border-amber-200',
  MOUNTAINOUS: 'bg-red-100 text-red-800 border-red-200',
  VALLEY: 'bg-blue-100 text-blue-800 border-blue-200',
  MIXED: 'bg-purple-100 text-purple-800 border-purple-200',
  RIVERINE: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

// Status colors for deliveries
const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  PICKED_UP: 'bg-amber-100 text-amber-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  NEAR_DESTINATION: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-slate-800',
};

// Simulated rider location for demo
const simulateRiderLocation = (progress: number, pickup: string, drop: string) => {
  const locations = [
    `Near ${pickup}`,
    'On Highway',
    'Mountain Pass',
    'Approaching Valley',
    'Near Town Center',
    `${drop} Area`,
  ];
  return locations[Math.floor(progress * locations.length / 100)] || pickup;
};

// Main Component
export function LogisticsSection() {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<LogisticsDashboard | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Delivery[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  // Filter state
  const [filterState, setFilterState] = useState('');
  const [filterTerrain, setFilterTerrain] = useState<TerrainType | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data generator for demo
  const generateMockData = useCallback(() => {
    const mockDashboard: LogisticsDashboard = {
      totalPartners: 15,
      activePartners: 12,
      totalRiders: 45,
      availableRiders: 28,
      activeDeliveries: 17,
      pendingOrders: 8,
      completedToday: 34,
      totalEarnings: 45600,
      currentSeason: 'DRY',
      weatherMultiplier: 1.0,
      shadowZones: 3,
    };

    const mockAvailableOrders: Delivery[] = [
      {
        id: 'del-1',
        orderId: 'ord-1',
        orderNumber: 'HH-2024-001',
        status: 'PENDING',
        pickupLocation: 'Tawang Market',
        pickupDistrict: 'Tawang',
        pickupState: 'Arunachal Pradesh',
        dropLocation: 'Itanagar',
        dropDistrict: 'Papum Pare',
        dropState: 'Arunachal Pradesh',
        estimatedDistance: 320,
        estimatedTime: 480,
        terrainType: 'MOUNTAINOUS',
        difficultyLevel: 8,
        elevationGain: 2500,
        baseFare: 850,
        terrainBonus: 450,
        totalEarnings: 1300,
        weatherMultiplier: 1.0,
        hazardZones: ['LANDSLIDE', 'FOG'],
        listing: { title: 'Organic Apples - 50kg', seller: { name: 'Tsering Norbu', phone: '+91 98765 43210' } },
        buyer: { name: 'Rajesh Kumar', phone: '+91 87654 32109' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'del-2',
        orderId: 'ord-2',
        orderNumber: 'HH-2024-002',
        status: 'PENDING',
        pickupLocation: 'Dibrugarh Tea Garden',
        pickupDistrict: 'Dibrugarh',
        pickupState: 'Assam',
        dropLocation: 'Guwahati Fancy Bazaar',
        dropDistrict: 'Kamrup Metropolitan',
        dropState: 'Assam',
        estimatedDistance: 450,
        estimatedTime: 360,
        terrainType: 'PLAIN',
        difficultyLevel: 3,
        elevationGain: 50,
        baseFare: 720,
        terrainBonus: 0,
        totalEarnings: 720,
        weatherMultiplier: 1.0,
        hazardZones: [],
        listing: { title: 'Premium Assam Tea - 100kg', seller: { name: 'Bapuk Das', phone: '+91 76543 21098' } },
        buyer: { name: 'Amit Sharma', phone: '+91 65432 10987' },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'del-3',
        orderId: 'ord-3',
        orderNumber: 'HH-2024-003',
        status: 'PENDING',
        pickupLocation: 'Champhai Farm',
        pickupDistrict: 'Champhai',
        pickupState: 'Mizoram',
        dropLocation: 'Aizawl Market',
        dropDistrict: 'Aizawl',
        dropState: 'Mizoram',
        estimatedDistance: 190,
        estimatedTime: 280,
        terrainType: 'HILLY',
        difficultyLevel: 6,
        elevationGain: 1200,
        baseFare: 480,
        terrainBonus: 240,
        totalEarnings: 720,
        weatherMultiplier: 1.2,
        hazardZones: ['POOR_ROAD'],
        listing: { title: 'Bird Eye Chilli - 25kg', seller: { name: 'Lalthanmawia', phone: '+91 54321 09876' } },
        buyer: { name: 'Zodinliana', phone: '+91 43210 98765' },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const mockActiveDeliveries: Delivery[] = [
      {
        id: 'del-active-1',
        orderId: 'ord-active-1',
        orderNumber: 'HH-2024-004',
        status: 'IN_TRANSIT',
        pickupLocation: 'Shillong Bara Bazaar',
        pickupDistrict: 'East Khasi Hills',
        pickupState: 'Meghalaya',
        dropLocation: 'Guwahati',
        dropDistrict: 'Kamrup Metropolitan',
        dropState: 'Assam',
        estimatedDistance: 100,
        estimatedTime: 180,
        terrainType: 'HILLY',
        difficultyLevel: 5,
        elevationGain: 800,
        currentLocation: 'Jorabat Junction',
        baseFare: 320,
        terrainBonus: 160,
        totalEarnings: 480,
        weatherMultiplier: 1.0,
        hazardZones: ['FOG'],
        listing: { title: 'Lakadong Turmeric - 30kg', seller: { name: 'John Marwein', phone: '+91 32109 87654' } },
        buyer: { name: 'Priya Devi', phone: '+91 21098 76543' },
        rider: {
          id: 'rider-1',
          name: 'Biren Kalita',
          phone: '+91 10987 65432',
          vehicleType: 'SMALL_TRUCK',
          vehicleNumber: 'AS-01-AB-1234',
          isAvailable: false,
          rating: 4.8,
          totalDeliveries: 156,
          terrainExpertise: ['HILLY', 'MOUNTAINOUS'],
          isVerified: true,
        },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const mockHistory: Delivery[] = [
      {
        id: 'del-hist-1',
        orderId: 'ord-hist-1',
        orderNumber: 'HH-2024-005',
        status: 'DELIVERED',
        pickupLocation: 'Gangtok',
        pickupDistrict: 'East Sikkim',
        pickupState: 'Sikkim',
        dropLocation: 'Siliguri',
        dropDistrict: 'Darjeeling',
        dropState: 'West Bengal',
        estimatedDistance: 120,
        estimatedTime: 240,
        terrainType: 'MOUNTAINOUS',
        difficultyLevel: 7,
        baseFare: 400,
        terrainBonus: 280,
        totalEarnings: 680,
        listing: { title: 'Large Cardamom - 20kg', seller: { name: 'Tashi Dorjee' } },
        buyer: { name: 'Completed Buyer' },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const mockRiders: Rider[] = [
      {
        id: 'rider-1',
        name: 'Biren Kalita',
        phone: '+91 98765 43210',
        vehicleType: 'SMALL_TRUCK',
        vehicleNumber: 'AS-01-AB-1234',
        currentLocation: 'Guwahati',
        currentDistrict: 'Kamrup Metropolitan',
        currentState: 'Assam',
        isAvailable: true,
        rating: 4.8,
        totalDeliveries: 156,
        terrainExpertise: ['HILLY', 'MOUNTAINOUS'],
        isVerified: true,
      },
      {
        id: 'rider-2',
        name: 'Limashed Ao',
        phone: '+91 87654 32109',
        vehicleType: 'BIKE',
        vehicleNumber: 'NL-05-CD-5678',
        currentLocation: 'Kohima',
        currentDistrict: 'Kohima',
        currentState: 'Nagaland',
        isAvailable: true,
        rating: 4.6,
        totalDeliveries: 89,
        terrainExpertise: ['HILLY'],
        isVerified: true,
      },
    ];

    return { dashboard: mockDashboard, availableOrders: mockAvailableOrders, activeDeliveries: mockActiveDeliveries, history: mockHistory, riders: mockRiders };
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const [dashRes, ordersRes, activeRes, ridersRes] = await Promise.allSettled([
        api('/api/logistics?action=dashboard'),
        api('/api/orders?status=CONFIRMED&limit=20'),
        api('/api/logistics?action=riders&availableOnly=false&limit=20'),
        api('/api/logistics/riders?limit=20'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value.data);
      } else {
        // Use mock data
        const mock = generateMockData();
        setDashboard(mock.dashboard);
      }

      if (ordersRes.status === 'fulfilled') {
        setAvailableOrders(ordersRes.value.data || []);
      } else {
        const mock = generateMockData();
        setAvailableOrders(mock.availableOrders);
      }

      if (activeRes.status === 'fulfilled') {
        setActiveDeliveries(activeRes.value.data || []);
      } else {
        const mock = generateMockData();
        setActiveDeliveries(mock.activeDeliveries);
      }

      if (ridersRes.status === 'fulfilled') {
        setRiders(ridersRes.value.data || []);
      } else {
        const mock = generateMockData();
        setRiders(mock.riders);
      }

      // Set mock history
      const mock = generateMockData();
      setDeliveryHistory(mock.history);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Use mock data on error
      const mock = generateMockData();
      setDashboard(mock.dashboard);
      setAvailableOrders(mock.availableOrders);
      setActiveDeliveries(mock.activeDeliveries);
      setDeliveryHistory(mock.history);
      setRiders(mock.riders);
    } finally {
      setLoading(false);
    }
  }, [generateMockData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Accept delivery
  const acceptDelivery = async (deliveryId: string) => {
    try {
      await api('/api/logistics', {
        method: 'POST',
        body: JSON.stringify({
          action: 'assign-rider',
          orderId: deliveryId,
        }),
      });
      toast.success('Delivery accepted!');
      fetchData();
    } catch {
      toast.success('Delivery accepted! (Demo mode)');
      // Move from available to active
      const delivery = availableOrders.find(d => d.id === deliveryId);
      if (delivery) {
        setAvailableOrders(prev => prev.filter(d => d.id !== deliveryId));
        setActiveDeliveries(prev => [...prev, { ...delivery, status: 'ACCEPTED' }]);
      }
    }
  };

  // Reject delivery
  const rejectDelivery = async (deliveryId: string) => {
    toast.info('Delivery declined');
    setAvailableOrders(prev => prev.filter(d => d.id !== deliveryId));
  };

  // Update delivery status
  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      await api(`/api/tracking/${deliveryId}`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch {
      toast.success(`Status updated to ${newStatus} (Demo mode)`);
      setActiveDeliveries(prev => prev.map(d =>
        d.id === deliveryId ? { ...d, status: newStatus } : d
      ));
    }
  };

  // Filter orders
  const filteredOrders = availableOrders.filter(order => {
    if (filterState && order.pickupState !== filterState && order.dropState !== filterState) return false;
    if (filterTerrain && order.terrainType !== filterTerrain) return false;
    return true;
  });

  if (!isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12"
      >
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
                <Truck className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Delivery Partner Portal</h2>
              <p className="text-muted-foreground mb-6">
                Join our network of delivery partners serving Northeast India&apos;s unique terrain.
                Earn money while connecting farmers with buyers.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">₹45,000+</p>
                  <p className="text-xs text-muted-foreground">Avg Monthly Earnings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">500+</p>
                  <p className="text-xs text-muted-foreground">Active Riders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">8</p>
                  <p className="text-xs text-muted-foreground">NE States Covered</p>
                </div>
              </div>
              <div className="space-y-3">
                <SignUpButton mode="modal">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Register as Delivery Partner
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-slate-50"
    >
      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">Delivery Partner Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage deliveries across Northeast India
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={() => toast.info('Route calculator coming soon!')}
            >
              <Route className="h-4 w-4 mr-2" />
              Calculate Route
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 md:h-28 rounded-xl" />
            ))}
          </div>
        ) : dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold">{dashboard.pendingOrders}</p>
                    <p className="text-xs text-muted-foreground truncate">Available Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold">{dashboard.activeDeliveries}</p>
                    <p className="text-xs text-muted-foreground truncate">Active Deliveries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold">{dashboard.completedToday}</p>
                    <p className="text-xs text-muted-foreground truncate">Completed Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold">₹{(dashboard.totalEarnings / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground truncate">Today&apos;s Earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Season & Weather Alert */}
        {dashboard && (
          <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-emerald-100">Current Season</p>
                    <p className="font-semibold text-sm">{dashboard.currentSeason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-emerald-100">Weather Multiplier</p>
                    <p className="font-semibold text-sm">{dashboard.weatherMultiplier}x</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <WifiOff className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-emerald-100">Shadow Zones</p>
                    <p className="font-semibold text-sm">{dashboard.shadowZones} Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 md:mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="available" className="text-xs md:text-sm">
              Available
              {filteredOrders.length > 0 && (
                <Badge className="ml-1 h-5 bg-emerald-500">{filteredOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs md:text-sm">
              Active
              {activeDeliveries.length > 0 && (
                <Badge className="ml-1 h-5 bg-blue-500">{activeDeliveries.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">History</TabsTrigger>
            <TabsTrigger value="riders" className="text-xs md:text-sm">Riders</TabsTrigger>
          </TabsList>

          {/* Available Orders Tab */}
          <TabsContent value="available">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {(filterState || filterTerrain) && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-emerald-500">
                        {(filterState ? 1 : 0) + (filterTerrain ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Filter Orders</SheetTitle>
                    <SheetDescription>Find deliveries that match your preferences</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">State</label>
                      <Select value={filterState} onValueChange={setFilterState}>
                        <SelectTrigger>
                          <SelectValue placeholder="All states" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All States</SelectItem>
                          {NE_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Terrain</label>
                      <Select value={filterTerrain} onValueChange={(v) => setFilterTerrain(v as TerrainType | '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="All terrains" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Terrains</SelectItem>
                          {Object.entries(TERRAIN_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key}>{info.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setFilterState(''); setFilterTerrain(''); }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              {(filterState || filterTerrain) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterState(''); setFilterTerrain(''); }}>
                  Clear
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <DeliveryOrderCard
                    key={order.id}
                    delivery={order}
                    onAccept={() => acceptDelivery(order.id)}
                    onReject={() => rejectDelivery(order.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No available orders matching your criteria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Deliveries Tab */}
          <TabsContent value="active">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : activeDeliveries.length > 0 ? (
              <div className="space-y-4">
                {activeDeliveries.map((delivery) => (
                  <ActiveDeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onUpdateStatus={updateDeliveryStatus}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active deliveries</p>
                  <p className="text-sm text-muted-foreground mt-1">Accept orders from the Available tab to start</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : deliveryHistory.length > 0 ? (
              <div className="space-y-4">
                {deliveryHistory.map((delivery) => (
                  <Card key={delivery.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{delivery.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {delivery.pickupLocation} → {delivery.dropLocation}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">₹{delivery.totalEarnings}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(delivery.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No delivery history yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Riders Tab */}
          <TabsContent value="riders">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : riders.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {riders.map((rider) => (
                  <Card key={rider.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {rider.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">{rider.name}</p>
                            <Badge variant={rider.isAvailable ? 'default' : 'secondary'} className={rider.isAvailable ? 'bg-emerald-500 shrink-0' : 'shrink-0'}>
                              {rider.isAvailable ? 'Available' : 'Busy'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{rider.phone}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {VEHICLE_INFO[rider.vehicleType]?.name || rider.vehicleType}
                            </Badge>
                            {rider.vehicleNumber && (
                              <span className="text-xs text-muted-foreground">{rider.vehicleNumber}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {rider.rating.toFixed(1)}
                            </span>
                            <span>{rider.totalDeliveries} deliveries</span>
                          </div>
                          {rider.terrainExpertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rider.terrainExpertise.slice(0, 3).map((terrain) => (
                                <Badge key={terrain} className={cn('text-xs', terrainColors[terrain])}>
                                  {TERRAIN_INFO[terrain]?.name || terrain}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No riders found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}

// Delivery Order Card Component
function DeliveryOrderCard({
  delivery,
  onAccept,
  onReject,
}: {
  delivery: Delivery;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold">{delivery.orderNumber}</p>
              <Badge className={cn('text-xs', terrainColors[delivery.terrainType])}>
                {TERRAIN_INFO[delivery.terrainType]?.name || delivery.terrainType}
              </Badge>
              {delivery.hazardZones && delivery.hazardZones.length > 0 && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {delivery.hazardZones.length} Hazards
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>{delivery.pickupLocation}</span>
              <span className="text-muted-foreground/50">→</span>
              <span>{delivery.dropLocation}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                {delivery.estimatedDistance} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor((delivery.estimatedTime || 0) / 60)}h {(delivery.estimatedTime || 0) % 60}m
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {delivery.listing?.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600">₹{delivery.totalEarnings}</p>
              <p className="text-xs text-muted-foreground">
                Base ₹{delivery.baseFare} + ₹{delivery.terrainBonus} terrain
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={onAccept}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Active Delivery Card Component
function ActiveDeliveryCard({
  delivery,
  onUpdateStatus,
}: {
  delivery: Delivery;
  onUpdateStatus: (status: string) => void;
}) {
  const statusFlow = ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED'];
  const currentIndex = statusFlow.indexOf(delivery.status);

  const getNextStatus = () => {
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{delivery.orderNumber}</p>
              <Badge className={cn('text-xs', statusColors[delivery.status])}>
                {delivery.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="font-semibold text-emerald-600">₹{delivery.totalEarnings}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span>{delivery.pickupLocation}</span>
            <span className="text-muted-foreground/50">→</span>
            <span>{delivery.dropLocation}</span>
          </div>

          {delivery.currentLocation && (
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-blue-500 animate-pulse" />
              <span>Current: {delivery.currentLocation}</span>
            </div>
          )}

          {delivery.rider && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                  {delivery.rider.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{delivery.rider.name}</p>
                <p className="text-xs text-muted-foreground">{delivery.rider.phone}</p>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-2">
            {statusFlow.slice(0, -1).map((status, index) => (
              <div
                key={status}
                className={cn(
                  'flex-1 h-2 rounded-full',
                  index <= currentIndex ? 'bg-emerald-500' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {nextStatus && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onUpdateStatus(nextStatus)}
            >
              Mark as {nextStatus.replace('_', ' ')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
