'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  Truck, MapPin, Navigation, Clock, Package, CheckCircle, AlertTriangle,
  Mountain, User, Phone, Star, TrendingUp, Eye, MessageCircle, RefreshCw,
  ChevronRight, AlertCircle, Wifi, WifiOff, Leaf, Droplets,
  Route, Calendar, Zap, Filter, Search, X, Play, Pause,
  Thermometer, CloudRain, Wind, Shield, Award, DollarSign, Timer,
  Check, Ban, ArrowRight, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TERRAIN_INFO, NE_STATES, NE_DISTRICTS, VEHICLE_INFO, type TerrainType, type VehicleType } from '@/types';

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

interface DeliveryEstimate {
  timeMinutes: number;
  timeFormatted: string;
  baseCost: number;
  terrainMultiplier: number;
  totalCost: number;
  breakdown: { component: string; amount: number; description: string }[];
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
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  
  // Simulated real-time tracking
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  // Estimate form state
  const [estimateForm, setEstimateForm] = useState({
    pickupState: '',
    pickupDistrict: '',
    deliveryState: '',
    deliveryDistrict: '',
    weightKg: 1,
    vehicleType: 'SMALL_TRUCK' as VehicleType,
  });
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [calculating, setCalculating] = useState(false);
  
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

  // Simulated real-time tracking
  useEffect(() => {
    if (isTrackingActive && selectedDelivery) {
      const interval = setInterval(() => {
        setTrackingProgress(prev => {
          if (prev >= 100) {
            setIsTrackingActive(false);
            return 100;
          }
          return prev + 2;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTrackingActive, selectedDelivery]);

  // Calculate delivery estimate
  const calculateEstimate = async () => {
    if (!estimateForm.pickupDistrict || !estimateForm.deliveryDistrict) {
      toast.error('Please select pickup and delivery locations');
      return;
    }

    setCalculating(true);
    try {
      const response = await api('/api/logistics', {
        method: 'POST',
        body: JSON.stringify({
          action: 'estimate',
          pickupDistrict: estimateForm.pickupDistrict,
          pickupState: estimateForm.pickupState,
          deliveryDistrict: estimateForm.deliveryDistrict,
          deliveryState: estimateForm.deliveryState,
          weightKg: estimateForm.weightKg,
          vehicleType: estimateForm.vehicleType,
        }),
      });
      setEstimate(response.data?.estimate || null);
      toast.success('Delivery estimate calculated!');
    } catch (error) {
      // Mock estimate for demo
      setEstimate({
        timeMinutes: 240,
        timeFormatted: '4h 0m',
        baseCost: 500,
        terrainMultiplier: 1.5,
        totalCost: 750,
        breakdown: [
          { component: 'Base Distance', amount: 400, description: '100km @ ₹4/km' },
          { component: 'Terrain Bonus', amount: 100, description: 'Hilly terrain 1.5x' },
          { component: 'GST (18%)', amount: 90, description: 'Tax' },
        ],
      });
    } finally {
      setCalculating(false);
    }
  };

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
  const filteredOrders = useMemo(() => {
    return availableOrders.filter(order => {
      if (filterState && order.pickupState !== filterState && order.dropState !== filterState) return false;
      if (filterTerrain && order.terrainType !== filterTerrain) return false;
      return true;
    });
  }, [availableOrders, filterState, filterTerrain]);

  // Get districts for selected state
  const pickupDistricts = estimateForm.pickupState ? NE_DISTRICTS[estimateForm.pickupState] || [] : [];
  const deliveryDistricts = estimateForm.deliveryState ? NE_DISTRICTS[estimateForm.deliveryState] || [] : [];

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
              onClick={() => setShowEstimateModal(true)}
              className="hidden md:flex"
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white md:hidden"
                  onClick={() => setShowEstimateModal(true)}
                >
                  <Route className="h-4 w-4" />
                </Button>
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
                    onViewDetails={() => {
                      setSelectedDelivery(order);
                      setShowDeliveryModal(true);
                    }}
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
                    onTrack={() => {
                      setSelectedDelivery(delivery);
                      setTrackingProgress(45);
                      setShowTrackingModal(true);
                    }}
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

      {/* Delivery Details Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Route Map Placeholder */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute left-4 top-1/2 w-3 h-3 bg-emerald-500 rounded-full" />
                  <div className="absolute right-4 top-1/2 w-3 h-3 bg-red-500 rounded-full" />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                    <path d="M20,50 Q50,20 100,50 Q150,80 180,50" stroke="#059669" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">{selectedDelivery.estimatedDistance} km route</p>
                  <p className="text-xs text-muted-foreground">Terrain: {TERRAIN_INFO[selectedDelivery.terrainType]?.name}</p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="font-medium">{selectedDelivery.pickupLocation}</p>
                    <p className="text-sm text-muted-foreground">{selectedDelivery.pickupDistrict}, {selectedDelivery.pickupState}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Navigation className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Drop-off</p>
                    <p className="font-medium">{selectedDelivery.dropLocation}</p>
                    <p className="text-sm text-muted-foreground">{selectedDelivery.dropDistrict}, {selectedDelivery.dropState}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Time</p>
                  <p className="font-medium">{Math.floor((selectedDelivery.estimatedTime || 0) / 60)}h {(selectedDelivery.estimatedTime || 0) % 60}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="font-medium">{selectedDelivery.difficultyLevel}/10</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elevation Gain</p>
                  <p className="font-medium">{selectedDelivery.elevationGain || 0}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="font-semibold text-emerald-600">₹{selectedDelivery.totalEarnings}</p>
                </div>
              </div>

              {/* Hazards */}
              {selectedDelivery.hazardZones && selectedDelivery.hazardZones.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Route Hazards
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDelivery.hazardZones.map((hazard, i) => (
                      <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        {hazard}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Info */}
              {selectedDelivery.listing && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Product</p>
                    <p className="font-medium">{selectedDelivery.listing.title}</p>
                    <p className="text-sm text-muted-foreground">Seller: {selectedDelivery.listing.seller.name}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeliveryModal(false)} className="w-full sm:w-auto">
              Close
            </Button>
            {selectedDelivery && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto text-red-600 hover:text-red-700"
                  onClick={() => { rejectDelivery(selectedDelivery.id); setShowDeliveryModal(false); }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => { acceptDelivery(selectedDelivery.id); setShowDeliveryModal(false); }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Delivery
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Real-time Tracking Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-600" />
              Live Tracking
            </DialogTitle>
            <DialogDescription>
              {selectedDelivery?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Map with moving rider */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-48 relative overflow-hidden">
                {/* Simulated route */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                  {/* Route path */}
                  <path 
                    d="M20,70 Q50,30 100,50 Q150,70 180,30" 
                    stroke="#059669" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Progress path */}
                  <path 
                    d="M20,70 Q50,30 100,50 Q150,70 180,30" 
                    stroke="#10B981" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${trackingProgress * 2},${200 - trackingProgress * 2}`}
                  />
                </svg>
                
                {/* Pickup marker */}
                <div className="absolute left-4 bottom-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs font-medium mt-1 bg-white/80 px-1 rounded">{selectedDelivery.pickupDistrict}</p>
                </div>
                
                {/* Rider marker - moves along route */}
                <motion.div 
                  className="absolute"
                  style={{
                    left: `${20 + trackingProgress * 1.4}%`,
                    top: `${70 - Math.sin(trackingProgress * 0.05) * 40}%`,
                  }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-white">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
                
                {/* Drop marker */}
                <div className="absolute right-4 top-4">
                  <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                    <Navigation className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs font-medium mt-1 bg-white/80 px-1 rounded">{selectedDelivery.dropDistrict}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Delivery Progress</span>
                  <span className="font-semibold">{trackingProgress}%</span>
                </div>
                <Progress value={trackingProgress} className="h-2" />
              </div>

              {/* Current Location */}
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Current Location</p>
                <p className="font-semibold">
                  {simulateRiderLocation(trackingProgress, selectedDelivery.pickupLocation || 'Pickup', selectedDelivery.dropLocation || 'Drop')}
                </p>
              </div>

              {/* ETA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="font-semibold">
                    {Math.max(0, Math.floor(((selectedDelivery.estimatedTime || 0) * (100 - trackingProgress)) / 100 / 60))}h {Math.max(0, ((selectedDelivery.estimatedTime || 0) * (100 - trackingProgress)) % 100 % 60)}m
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Distance Left</p>
                  <p className="font-semibold">
                    {Math.round(((selectedDelivery.estimatedDistance || 0) * (100 - trackingProgress)) / 100)} km
                  </p>
                </div>
              </div>

              {/* Weather & Terrain */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <CloudRain className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Weather Advisory</p>
                  <p className="text-xs text-muted-foreground">Clear conditions • {TERRAIN_INFO[selectedDelivery.terrainType]?.name} terrain</p>
                </div>
              </div>

              {/* Rider Info */}
              {selectedDelivery.rider && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {selectedDelivery.rider.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedDelivery.rider.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDelivery.rider.phone}</p>
                  </div>
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Simulation Controls */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsTrackingActive(!isTrackingActive)}
                >
                  {isTrackingActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isTrackingActive ? 'Pause' : 'Start'} Tracking
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackingModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estimate Modal */}
      <Dialog open={showEstimateModal} onOpenChange={setShowEstimateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calculate Delivery Estimate</DialogTitle>
            <DialogDescription>
              Get terrain-aware delivery cost and time estimates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup State</label>
              <Select
                value={estimateForm.pickupState}
                onValueChange={(v) => setEstimateForm(prev => ({ ...prev, pickupState: v, pickupDistrict: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NE_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup District</label>
              <Select
                value={estimateForm.pickupDistrict}
                onValueChange={(v) => setEstimateForm(prev => ({ ...prev, pickupDistrict: v }))}
                disabled={!estimateForm.pickupState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {pickupDistricts.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery State</label>
              <Select
                value={estimateForm.deliveryState}
                onValueChange={(v) => setEstimateForm(prev => ({ ...prev, deliveryState: v, deliveryDistrict: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NE_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery District</label>
              <Select
                value={estimateForm.deliveryDistrict}
                onValueChange={(v) => setEstimateForm(prev => ({ ...prev, deliveryDistrict: v }))}
                disabled={!estimateForm.deliveryState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryDistricts.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input
                  type="number"
                  value={estimateForm.weightKg}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, weightKg: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle Type</label>
                <Select
                  value={estimateForm.vehicleType}
                  onValueChange={(v) => setEstimateForm(prev => ({ ...prev, vehicleType: v as VehicleType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLE_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {estimate && (
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Estimated Time</span>
                <span>{estimate.timeFormatted}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Total Cost</span>
                <span className="text-lg font-bold text-emerald-600">₹{estimate.totalCost}</span>
              </div>
              <Separator className="my-2" />
              {estimate.breakdown.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-muted-foreground">
                  <span>{item.component}</span>
                  <span>₹{item.amount}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEstimateModal(false)}>
              Close
            </Button>
            <Button onClick={calculateEstimate} disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Delivery Order Card Component
function DeliveryOrderCard({ 
  delivery, 
  onAccept, 
  onReject, 
  onViewDetails 
}: { 
  delivery: Delivery; 
  onAccept: () => void; 
  onReject: () => void; 
  onViewDetails: () => void;
}) {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        {/* Header with terrain */}
        <div className={cn(
          'px-4 py-2 flex items-center justify-between',
          terrainColors[delivery.terrainType]?.replace('text-', 'bg-').split(' ')[0] || 'bg-slate-100'
        )}>
          <div className="flex items-center gap-2">
            <Badge className={cn('font-mono', terrainColors[delivery.terrainType])}>
              {delivery.orderNumber}
            </Badge>
            <Badge className={terrainColors[delivery.terrainType]}>
              {TERRAIN_INFO[delivery.terrainType]?.name || delivery.terrainType}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>~{Math.floor((delivery.estimatedTime || 0) / 60)}h</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Route */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{delivery.pickupLocation}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="truncate">{delivery.dropLocation}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Distance</p>
                  <p className="font-medium">{delivery.estimatedDistance} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Difficulty</p>
                  <p className="font-medium">{delivery.difficultyLevel}/10</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Elevation</p>
                  <p className="font-medium">{delivery.elevationGain || 0}m</p>
                </div>
              </div>

              {/* Hazards */}
              {delivery.hazardZones && delivery.hazardZones.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <div className="flex flex-wrap gap-1">
                    {delivery.hazardZones.slice(0, 3).map((hazard, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                        {hazard}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Earnings */}
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Earnings</p>
              <p className="text-xl font-bold text-emerald-600">₹{delivery.totalEarnings}</p>
              {delivery.terrainBonus > 0 && (
                <p className="text-xs text-muted-foreground">+₹{delivery.terrainBonus} terrain bonus</p>
              )}
            </div>
          </div>

          {/* Product & Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex-1 min-w-0">
              {delivery.listing && (
                <>
                  <p className="font-medium text-sm truncate">{delivery.listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Seller: {delivery.listing.seller.name}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
              <Button variant="outline" size="sm" onClick={onReject} className="text-red-600 hover:text-red-700">
                <Ban className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onAccept} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="h-4 w-4 mr-1" />
                Accept
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
  onTrack 
}: { 
  delivery: Delivery; 
  onUpdateStatus: (id: string, status: string) => void; 
  onTrack: () => void;
}) {
  const statusProgress: Record<string, number> = {
    ASSIGNED: 15,
    ACCEPTED: 25,
    PICKED_UP: 50,
    IN_TRANSIT: 70,
    NEAR_DESTINATION: 85,
    DELIVERED: 100,
  };

  const progress = statusProgress[delivery.status] || 0;

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white">{delivery.orderNumber}</Badge>
            <Badge className={cn('bg-white/20', statusColors[delivery.status])}>
              {delivery.status.replace('_', ' ')}
            </Badge>
          </div>
          <Button variant="secondary" size="sm" onClick={onTrack} className="bg-white/20 hover:bg-white/30 text-white">
            <Radio className="h-4 w-4 mr-1" />
            Track
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Route */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-emerald-500 flex items-center justify-center">
              <MapPin className="h-2 w-2 text-white" />
            </div>
            <span>{delivery.pickupLocation}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-red-500 flex items-center justify-center">
              <Navigation className="h-2 w-2 text-white" />
            </div>
            <span>{delivery.dropLocation}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-semibold">{delivery.estimatedDistance}km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ETA</p>
            <p className="font-semibold">{Math.floor((delivery.estimatedTime || 0) / 60)}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Terrain</p>
            <Badge className={terrainColors[delivery.terrainType]}>
              {TERRAIN_INFO[delivery.terrainType]?.name}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Earnings</p>
            <p className="font-semibold text-emerald-600">₹{delivery.totalEarnings}</p>
          </div>
        </div>

        {/* Current Location */}
        {delivery.currentLocation && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Current Location</p>
              <p className="font-medium">{delivery.currentLocation}</p>
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="flex flex-wrap gap-2">
          {delivery.status === 'ACCEPTED' && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onUpdateStatus(delivery.id, 'PICKED_UP')}
            >
              <Package className="h-4 w-4 mr-1" />
              Picked Up
            </Button>
          )}
          {delivery.status === 'PICKED_UP' && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onUpdateStatus(delivery.id, 'IN_TRANSIT')}
            >
              <Truck className="h-4 w-4 mr-1" />
              In Transit
            </Button>
          )}
          {delivery.status === 'IN_TRANSIT' && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus(delivery.id, 'NEAR_DESTINATION')}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Near Destination
              </Button>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onUpdateStatus(delivery.id, 'DELIVERED')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Delivered
              </Button>
            </>
          )}
        </div>

        {/* Contact */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          {delivery.buyer && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-100 text-slate-700">
                  {delivery.buyer.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{delivery.buyer.name}</p>
                <p className="text-xs text-muted-foreground">{delivery.buyer.phone}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
