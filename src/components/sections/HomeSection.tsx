'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  ArrowRight, Leaf, Mountain, User, Truck, Package, Star, MapPin,
  TrendingUp, Clock, Shield, Award, ChevronRight, Play, Quote,
  CheckCircle, Sprout, Globe, Heart, Zap, Phone, Mail, Twitter,
  Facebook, Instagram, Youtube, ArrowUpRight, Search, Sun, CloudRain,
  Snowflake, Droplets, Calendar, PartyPopper, Store, Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, NE_STATE_INFO, REGION_PRODUCTS, NE_MARKETS } from '@/types';

// Types
type Category = keyof typeof CATEGORY_LABELS;

interface User {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  district?: string;
  state?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  unit: string;
  minOrder: number;
  quality: string;
  isOrganic: boolean;
  isVerified: boolean;
  district: string;
  state: string;
  viewCount: number;
  orderCount: number;
  createdAt: string;
  seller: User;
  avgRating?: number;
}

interface HomeSectionProps {
  onNavigate: (section: string) => void;
}

// NE India Regional Product Categories with Icons
const NE_REGIONAL_CATEGORIES = [
  { id: 'naga-chilli', name: 'Naga Chilli', localName: 'Bhut Jolokia', state: 'Nagaland', icon: '🌶️', color: 'from-red-500 to-orange-600', description: 'World\'s hottest chilli, Ghost Pepper' },
  { id: 'assam-tea', name: 'Assam Tea', localName: 'Sah', state: 'Assam', icon: '🍵', color: 'from-amber-500 to-orange-500', description: 'World-famous orthodox and CTC tea' },
  { id: 'chakhao', name: 'Chakhao', localName: 'Black Rice', state: 'Manipur', icon: '🍚', color: 'from-purple-500 to-violet-600', description: 'Aromatic black rice with GI tag' },
  { id: 'sikkim-cardamom', name: 'Sikkim Cardamom', localName: 'Elaichi', state: 'Sikkim', icon: '🌱', color: 'from-emerald-500 to-green-600', description: 'Large cardamom from the Himalayas' },
  { id: 'lakadong-turmeric', name: 'Lakadong Turmeric', localName: 'Halodhi', state: 'Meghalaya', icon: '🟡', color: 'from-yellow-400 to-amber-500', description: 'Highest curcumin content in the world' },
  { id: 'tripura-pineapple', name: 'Tripura Pineapple', localName: 'Anaros', state: 'Tripura', icon: '🍍', color: 'from-yellow-400 to-yellow-600', description: 'Queen variety pineapple' },
  { id: 'arunachal-kiwi', name: 'Arunachal Kiwi', localName: 'Kiwi', state: 'Arunachal Pradesh', icon: '🥝', color: 'from-lime-400 to-green-500', description: 'Organic kiwi from the Himalayas' },
  { id: 'mizoram-ginger', name: 'Mizoram Ginger', localName: 'Aiding', state: 'Mizoram', icon: '🫚', color: 'from-amber-300 to-yellow-500', description: 'Premium organic ginger' },
  { id: 'handicrafts', name: 'Traditional Handicrafts', localName: 'Haat Haat', state: 'All NE States', icon: '🧺', color: 'from-rose-400 to-pink-500', description: 'Bamboo, cane, and textile crafts' },
  { id: 'bamboo-products', name: 'Bamboo Products', localName: 'Baah', state: 'All NE States', icon: '🎋', color: 'from-teal-400 to-emerald-500', description: 'Sustainable bamboo products' },
];

// NE India Festivals
const NE_FESTIVALS = [
  { name: 'Bihu', state: 'Assam', month: 'Apr, Jan', icon: '🎭', description: 'Harvest festival celebrating agricultural cycles' },
  { name: 'Hornbill', state: 'Nagaland', month: 'Dec', icon: '🦅', description: 'Festival of festivals showcasing Naga heritage' },
  { name: 'Wangala', state: 'Meghalaya', month: 'Nov', icon: '🥁', description: '100 drums festival of Garo tribe' },
  { name: 'Losar', state: 'Sikkim', month: 'Feb', icon: '🪷', description: 'Tibetan New Year celebrations' },
  { name: 'Chapchar Kut', state: 'Mizoram', month: 'Mar', icon: '💃', description: 'Spring festival after jungle clearing' },
  { name: 'Ningol Chakouba', state: 'Manipur', month: 'Nov', icon: '👨‍👩‍👧‍👦', description: 'Family gathering festival' },
];

// State Colors for NE India
const STATE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  'Arunachal Pradesh': { primary: 'emerald-600', secondary: 'teal-500', accent: 'yellow-400' },
  'Assam': { primary: 'green-600', secondary: 'lime-500', accent: 'red-500' },
  'Manipur': { primary: 'violet-600', secondary: 'purple-500', accent: 'pink-400' },
  'Meghalaya': { primary: 'amber-600', secondary: 'yellow-500', accent: 'orange-400' },
  'Mizoram': { primary: 'blue-600', secondary: 'sky-500', accent: 'cyan-400' },
  'Nagaland': { primary: 'red-600', secondary: 'orange-500', accent: 'amber-400' },
  'Sikkim': { primary: 'emerald-600', secondary: 'green-500', accent: 'white' },
  'Tripura': { primary: 'yellow-600', secondary: 'amber-500', accent: 'red-400' },
};

// Current Season Detection
function getCurrentSeason(): { season: string; icon: React.ReactNode; description: string } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) {
    return { season: 'Spring', icon: <Sprout className="h-5 w-5 text-green-500" />, description: 'Fresh harvest season - Tea, Ginger, Turmeric' };
  } else if (month >= 5 && month <= 8) {
    return { season: 'Monsoon', icon: <CloudRain className="h-5 w-5 text-blue-500" />, description: 'Rainy season - Pineapple, Passion Fruit in abundance' };
  } else if (month >= 9 && month <= 10) {
    return { season: 'Autumn', icon: <Leaf className="h-5 w-5 text-amber-500" />, description: 'Harvest season - Rice, Cardamom, Kiwi' };
  } else {
    return { season: 'Winter', icon: <Snowflake className="h-5 w-5 text-cyan-500" />, description: 'Cold season - Oranges, Apples, Mustard greens' };
  }
}

// API helper
const api = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return response.json();
};

// Traditional Weaving Pattern SVG Component
function WeavingPattern({ className }: { className?: string }) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="ne-weave" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,0 L8,8 M8,0 L0,8" stroke="currentColor" strokeWidth="0.3" fill="none" />
          <rect x="2" y="2" width="4" height="4" stroke="currentColor" strokeWidth="0.2" fill="none" />
        </pattern>
        <pattern id="tribal" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6,0 L6,12 M0,6 L12,6" stroke="currentColor" strokeWidth="0.3" fill="none" />
          <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="0.2" fill="none" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#ne-weave)" />
    </svg>
  );
}

// Mountain Illustration Component
function MountainIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-full h-auto', className)} viewBox="0 0 1200 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="mountain3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="snow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      
      {/* Far mountains */}
      <path d="M0,200 L0,120 L150,60 L300,100 L450,40 L600,90 L750,30 L900,80 L1050,50 L1200,100 L1200,200 Z" fill="url(#mountain1)" opacity="0.6" />
      
      {/* Mid mountains */}
      <path d="M0,200 L0,140 L100,100 L200,130 L350,70 L500,110 L650,60 L800,100 L950,50 L1100,90 L1200,120 L1200,200 Z" fill="url(#mountain2)" opacity="0.8" />
      
      {/* Near mountains */}
      <path d="M0,200 L0,160 L80,140 L200,160 L350,100 L450,140 L600,90 L750,130 L900,80 L1050,120 L1200,100 L1200,200 Z" fill="url(#mountain3)" />
      
      {/* Snow caps */}
      <path d="M750,30 L770,50 L730,50 Z" fill="url(#snow)" opacity="0.9" />
      <path d="M450,40 L470,60 L430,60 Z" fill="url(#snow)" opacity="0.9" />
      <path d="M1050,50 L1070,70 L1030,70 Z" fill="url(#snow)" opacity="0.9" />
    </svg>
  );
}

// Main Component
export function HomeSection({ onNavigate }: HomeSectionProps) {
  const { isSignedIn } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  
  const currentSeason = getCurrentSeason();

  // Fetch featured listings
  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await api('/api/listings?limit=8&sortBy=viewCount');
        setListings(response.data);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    listings.forEach(l => {
      stats[l.category] = (stats[l.category] || 0) + 1;
    });
    return Object.entries(CATEGORY_LABELS)
      .map(([category, label]) => ({
        category: category as Category,
        label,
        count: stats[category] || Math.floor(Math.random() * 50) + 10,
        icon: getCategoryIcon(category),
        color: getCategoryColor(category),
      }))
      .filter(c => c.count > 0)
      .slice(0, 6);
  }, [listings]);

  // Featured farmers
  const featuredFarmers = useMemo(() => {
    const farmers = new Map<string, User & { listings: number; products: Listing[] }>();
    listings.forEach(l => {
      if (!farmers.has(l.seller.id)) {
        farmers.set(l.seller.id, { ...l.seller, listings: 1, products: [l] });
      } else {
        const f = farmers.get(l.seller.id)!;
        f.listings++;
        f.products.push(l);
      }
    });
    return Array.from(farmers.values()).slice(0, 4);
  }, [listings]);

  // Get featured products by state
  const stateProducts = useMemo(() => {
    const products: Record<string, Listing[]> = {};
    listings.forEach(l => {
      if (!products[l.state]) {
        products[l.state] = [];
      }
      if (products[l.state].length < 3) {
        products[l.state].push(l);
      }
    });
    return products;
  }, [listings]);

  // Newsletter submit
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setEmailSubmitted(true);
      setTimeout(() => setEmailSubmitted(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section with Parallax and Cultural Elements */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Cultural Weaving Pattern Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
          <div className="absolute inset-0 opacity-10">
            <WeavingPattern className="text-white" />
          </div>
          
          {/* Tribal Motif Decorations */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 opacity-80" />
          
          {/* Floating Cultural Elements */}
          <motion.div
            className="absolute top-20 left-10 text-6xl opacity-20"
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            🌿
          </motion.div>
          <motion.div
            className="absolute top-40 right-20 text-5xl opacity-20"
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            🏔️
          </motion.div>
          <motion.div
            className="absolute bottom-40 left-1/4 text-4xl opacity-20"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌶️
          </motion.div>
          <motion.div
            className="absolute bottom-20 right-1/4 text-5xl opacity-20"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🍵
          </motion.div>
          
          {/* Traditional Motif - Left */}
          <div className="absolute left-4 top-1/4 w-16 h-64 opacity-20">
            <div className="h-full border-l-4 border-white/50 border-dashed" />
            <div className="absolute top-1/4 -left-2 w-8 h-8 border-2 border-white/50 rounded-full" />
            <div className="absolute top-1/2 -left-2 w-8 h-8 border-2 border-white/50 rounded-full" />
            <div className="absolute top-3/4 -left-2 w-8 h-8 border-2 border-white/50 rounded-full" />
          </div>
          
          {/* Traditional Motif - Right */}
          <div className="absolute right-4 top-1/4 w-16 h-64 opacity-20">
            <div className="h-full border-r-4 border-white/50 border-dashed" />
            <div className="absolute top-1/4 -right-2 w-8 h-8 border-2 border-white/50 rounded-full" />
            <div className="absolute top-1/2 -right-2 w-8 h-8 border-2 border-white/50 rounded-full" />
            <div className="absolute top-3/4 -right-2 w-8 h-8 border-2 border-white/50 rounded-full" />
          </div>
        </div>

        <motion.div style={{ y: heroY }} className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Season Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4"
              >
                {currentSeason.icon}
                <span className="text-emerald-100 text-sm font-medium">
                  {currentSeason.season} in NE India - {currentSeason.description}
                </span>
              </motion.div>
              
              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-emerald-100 text-sm font-medium">
                  🌱 2,500+ Farmers from 8 NE States
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                From the{' '}
                <span className="relative">
                  <span className="relative z-10 text-emerald-200">Seven Sisters</span>
                  <motion.span
                    className="absolute bottom-2 left-0 w-full h-3 bg-emerald-400/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
                <br />
                <span className="text-amber-300">& One Brother</span>
                <br />
                to Your Doorstep
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100 mb-8 leading-relaxed max-w-xl">
                Connect directly with verified farmers from Northeast India&apos;s pristine hilly regions. 
                Get authentic <span className="text-amber-200 font-semibold">Naga Chilli</span>, 
                <span className="text-emerald-200 font-semibold"> Assam Tea</span>, 
                <span className="text-purple-200 font-semibold"> Chakhao Black Rice</span>, and more!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-8 text-lg font-semibold shadow-xl shadow-emerald-900/30"
                    onClick={() => onNavigate('marketplace')}
                  >
                    Explore Marketplace
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg font-semibold border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    onClick={() => onNavigate('sell')}
                  >
                    <Sprout className="mr-2 h-5 w-5" />
                    Start Selling
                  </Button>
                </motion.div>
              </div>

              {/* Trust Badges - NE India Specific */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                {[
                  { icon: Shield, label: 'Verified Farmers' },
                  { icon: Leaf, label: '100% Organic' },
                  { icon: Mountain, label: '8 NE States' },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2 text-white/80"
                  >
                    <badge.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{badge.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - State Highlights */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                {NE_STATE_INFO.slice(0, 8).map((state, index) => (
                  <motion.div
                    key={state.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.08 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 cursor-pointer"
                    onMouseEnter={() => setSelectedState(state.name)}
                    onMouseLeave={() => setSelectedState(null)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getStateEmoji(state.name)}</span>
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{state.name}</p>
                        <p className="text-xs text-emerald-200">{state.specialProducts[0]}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {state.specialProducts.slice(0, 2).map((product, i) => (
                        <Badge key={i} className="bg-emerald-500/30 text-emerald-100 text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mountain Illustration at Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <MountainIllustration className="h-24 opacity-30" />
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Regional Product Categories Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 via-blue-500 to-purple-500" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-amber-100 text-amber-700 mb-4">
              🌶️ Northeast Specialties
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Regional Product Categories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover authentic products unique to each Northeast Indian state, 
              from the world&apos;s hottest chilli to the finest organic tea
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {NE_REGIONAL_CATEGORIES.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cursor-pointer"
                onClick={() => onNavigate('marketplace')}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                  <CardContent className="p-4 text-center relative">
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br',
                      cat.color
                    )} />
                    <div className="text-4xl mb-2 relative z-10">{cat.icon}</div>
                    <p className="font-semibold text-sm mb-1 relative z-10">{cat.name}</p>
                    <p className="text-xs text-muted-foreground relative z-10">{cat.localName}</p>
                    <Badge variant="outline" className="mt-2 text-xs relative z-10">
                      {cat.state}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* State-wise Product Highlights */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              <MapPin className="h-3 w-3 mr-1" /> From Every Corner of NE India
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              State-wise Product Highlights
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each state has its unique produce - explore the specialties from all 8 states
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {NE_STATE_INFO.map((state, index) => (
              <motion.div
                key={state.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                  <div className={cn(
                    'h-2 bg-gradient-to-r',
                    `from-${STATE_COLORS[state.name]?.primary || 'emerald-600'} to-${STATE_COLORS[state.name]?.secondary || 'teal-500'}`
                  )} style={{
                    background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                  }} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{getStateEmoji(state.name)}</span>
                      <div>
                        <h3 className="font-bold text-lg">{state.name}</h3>
                        <p className="text-xs text-muted-foreground">Capital: {state.capital}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Special Products</p>
                      <div className="flex flex-wrap gap-1">
                        {state.specialProducts.slice(0, 4).map((product, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        <span>{state.averageElevation}m avg</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{state.districts.length} districts</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => onNavigate('marketplace')}
                    >
                      View Products
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Highlights Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <WeavingPattern className="text-emerald-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              {currentSeason.icon} Current Season
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Seasonal Highlights
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What&apos;s fresh this season in Northeast India
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Current Season Products */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      {currentSeason.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">Current Season</h3>
                      <p className="text-sm text-muted-foreground">{currentSeason.season}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{currentSeason.description}</p>
                  <div className="space-y-2">
                    {['Fresh Tea Leaves', 'Organic Ginger', 'Turmeric', 'Seasonal Vegetables'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Harvest Seasons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold">Upcoming Harvest</h3>
                      <p className="text-sm text-muted-foreground">Next 2 months</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { crop: 'Large Cardamom', region: 'Sikkim', time: 'Sep-Nov' },
                      { crop: 'Kiwi', region: 'Arunachal', time: 'Nov-Feb' },
                      { crop: 'Naga Chilli', region: 'Nagaland', time: 'Aug-Dec' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.crop}</p>
                          <p className="text-xs text-muted-foreground">{item.region}</p>
                        </div>
                        <Badge variant="outline">{item.time}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Festival Specials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <PartyPopper className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold">Festival Specials</h3>
                      <p className="text-sm text-muted-foreground">Cultural celebrations</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {NE_FESTIVALS.map((festival, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-lg">
                        <span className="text-xl">{festival.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{festival.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{festival.state} • {festival.month}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-emerald-100 text-emerald-700 mb-2">
                <TrendingUp className="h-3 w-3 mr-1" /> Trending Now
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">Fresh from the Hills</h2>
              <p className="text-muted-foreground mt-2">Handpicked products from verified farmers</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Button variant="outline" className="gap-2" onClick={() => onNavigate('marketplace')}>
                View All Products <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <Skeleton className="h-48 w-full mb-4 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard listing={listing} onNavigate={onNavigate} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us - NE India Focus */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              Why Hill-Haat
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The NE India Advantage
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We understand the unique challenges and opportunities of Northeast India
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Mountain,
                title: 'Terrain-Aware Logistics',
                description: 'Smart routing that understands NE India\'s mountainous terrain and monsoon challenges.',
                color: 'text-blue-600 bg-blue-100',
              },
              {
                icon: Shield,
                title: 'Verified Farmers',
                description: 'Every farmer is verified with Aadhaar and bank account. Know exactly who grows your food.',
                color: 'text-emerald-600 bg-emerald-100',
              },
              {
                icon: Leaf,
                title: 'GI Tag Products',
                description: 'Authentic GI-tagged products like Chakhao Black Rice, Naga Chilli, and Assam Tea.',
                color: 'text-amber-600 bg-amber-100',
              },
              {
                icon: Globe,
                title: '8 States Coverage',
                description: 'From Arunachal to Tripura, connect with farmers across all Northeast states.',
                color: 'text-purple-600 bg-purple-100',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={cn('inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6', feature.color)}
                >
                  <feature.icon className="h-8 w-8" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Markets & Haats */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <WeavingPattern className="text-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-white/20 text-white mb-4">
              <Store className="h-3 w-3 mr-1" /> Popular Haats & Markets
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Where Farmers Sell
            </h2>
            <p className="text-emerald-100 max-w-2xl mx-auto">
              Traditional weekly markets and permanent markets across Northeast India
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {NE_MARKETS.slice(0, 8).map((market, index) => (
              <motion.div
                key={`${market.name}-${market.state}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{market.name}</h3>
                  <Badge className="bg-white/20 text-white text-xs">
                    {market.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-200 mb-2">{market.district}, {market.state}</p>
                <div className="flex flex-wrap gap-1">
                  {market.majorProducts.slice(0, 2).map((product, i) => (
                    <Badge key={i} className="bg-emerald-500/30 text-emerald-100 text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              <Heart className="h-3 w-3 mr-1" /> Loved by Customers
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our Community Says
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories from farmers and buyers across Northeast India
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Hill-Haat helped me sell my Naga Chilli directly to customers across India. The terrain-aware delivery ensures my products reach fresh!",
                name: "Limasen Ao",
                role: "Chilli Farmer, Mokokchung, Nagaland",
                rating: 5,
                image: "👨‍🌾",
              },
              {
                quote: "I can finally get authentic Chakhao Black Rice directly from Manipuri farmers. The quality is exceptional and the prices are fair.",
                name: "Priya Devi",
                role: "Restaurant Owner, Guwahati",
                rating: 5,
                image: "👩‍🍳",
              },
              {
                quote: "The Lakadong Turmeric I bought from Meghalaya has the highest curcumin content. Hill-Haat made it easy to source directly from farmers.",
                name: "Tashi Dorjee",
                role: "Ayurvedic Practitioner, Gangtok",
                rating: 5,
                image: "🧑‍⚕️",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-emerald-300 mb-4" />
                    <p className="text-muted-foreground mb-6">{testimonial.quote}</p>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{testimonial.image}</div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Farmers */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              <Award className="h-3 w-3 mr-1" /> Featured Farmers
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Meet Our Star Farmers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dedicated farmers who bring you the freshest produce from Northeast India
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFarmers.length > 0 ? featuredFarmers.map((farmer, index) => (
              <motion.div
                key={farmer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg overflow-hidden group">
                  <CardContent className="p-6 text-center">
                    <div className="relative inline-block mb-4">
                      <Avatar className="h-20 w-20 border-4 border-emerald-100">
                        <AvatarImage src={farmer.avatar} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          {farmer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {farmer.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{farmer.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {farmer.district}, {farmer.state}
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{farmer.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({farmer.reviewCount} reviews)</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                      {farmer.listings} Products
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              // Default farmers when no data
              [
                { name: "Rahul Sharma", location: "West Tripura, Tripura", rating: 4.8, reviews: 23, products: 5, emoji: '🍍' },
                { name: "Tashi Dorjee", location: "East Sikkim, Sikkim", rating: 4.9, reviews: 18, products: 3, emoji: '🌱' },
                { name: "Limasen Ao", location: "Mokokchung, Nagaland", rating: 4.6, reviews: 15, products: 4, emoji: '🌶️' },
                { name: "Priya Devi", location: "Imphal West, Manipur", rating: 4.7, reviews: 31, products: 6, emoji: '🍚' },
              ].map((farmer, index) => (
                <motion.div
                  key={farmer.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-6 text-center">
                      <div className="text-5xl mb-4">{farmer.emoji}</div>
                      <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-emerald-100">
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          {farmer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-1">{farmer.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{farmer.location}</p>
                      <div className="flex items-center justify-center gap-1 mb-3">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{farmer.rating}</span>
                        <span className="text-muted-foreground">({farmer.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                        {farmer.products} Products
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <WeavingPattern className="text-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-emerald-500/20 text-emerald-400 mb-4">
              <Zap className="h-3 w-3 mr-1" /> Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Get fresh produce from NE India in 3 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            
            {[
              {
                step: '01',
                title: 'Browse by Region',
                description: 'Explore products from all 8 NE states. Filter by state, product type, or seasonal availability.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Connect with Farmers',
                description: 'View farmer profiles, verify their credentials, and place your order directly.',
                icon: User,
              },
              {
                step: '03',
                title: 'Track Your Delivery',
                description: 'Real-time tracking with terrain-aware delivery estimation for NE India\'s unique geography.',
                icon: Truck,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 relative z-10"
                  >
                    <item.icon className="h-10 w-10 text-white" />
                  </motion.div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 mt-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <WeavingPattern className="text-emerald-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              <Mail className="h-3 w-3 mr-1" /> Newsletter
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stay Updated from the Hills
            </h2>
            <p className="text-muted-foreground mb-8">
              Get notified about seasonal products, harvest updates, and festival specials from Northeast India.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white border-emerald-200 focus:border-emerald-500"
              />
              <Button type="submit" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700">
                {emailSubmitted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-4">
              Join 5,000+ subscribers. No spam, unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden"
          >
            {/* Cultural Border */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-blue-500" />
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-red-500" />
            
            {/* Weaving Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <WeavingPattern className="text-white" />
            </div>
            
            {/* Glowing Orbs */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Experience NE India?
              </h2>
              <p className="text-emerald-100 max-w-2xl mx-auto mb-8 text-lg">
                Join thousands of farmers and buyers connecting through Hill-Haat. 
                From the Seven Sisters & One Brother to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isSignedIn ? (
                  <>
                    <SignUpButton mode="modal">
                      <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-10 text-lg font-semibold">
                        Get Started Free <ArrowUpRight className="h-5 w-5 ml-2" />
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold border-white/30 text-white hover:bg-white/10">
                        Sign In
                      </Button>
                    </SignInButton>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-10 text-lg font-semibold" onClick={() => onNavigate('marketplace')}>
                      Start Shopping <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold border-white/30 text-white hover:bg-white/10" onClick={() => onNavigate('sell')}>
                      Become a Seller <Sprout className="h-5 w-5 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

// Helper functions
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    VEGETABLES: '🥬',
    FRUITS: '🍎',
    SPICES: '🌶️',
    GRAINS: '🌾',
    DAIRY: '🥛',
    HERBS: '🌿',
    BAMBOO_PRODUCTS: '🎋',
    HANDICRAFTS: '🧺',
    TEA: '🍵',
    HONEY: '🍯',
    OTHER: '📦',
  };
  return icons[category] || '📦';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    VEGETABLES: 'from-green-400 to-emerald-500',
    FRUITS: 'from-red-400 to-pink-500',
    SPICES: 'from-orange-400 to-red-500',
    GRAINS: 'from-amber-400 to-yellow-500',
    DAIRY: 'from-blue-400 to-cyan-500',
    HERBS: 'from-lime-400 to-green-500',
    BAMBOO_PRODUCTS: 'from-teal-400 to-emerald-500',
    HANDICRAFTS: 'from-purple-400 to-pink-500',
    TEA: 'from-emerald-400 to-teal-500',
    HONEY: 'from-amber-400 to-orange-500',
    OTHER: 'from-slate-400 to-gray-500',
  };
  return colors[category] || 'from-slate-400 to-gray-500';
}

function getStateEmoji(state: string): string {
  const emojis: Record<string, string> = {
    'Arunachal Pradesh': '🏔️',
    'Assam': '🍵',
    'Manipur': '🍚',
    'Meghalaya': '🍯',
    'Mizoram': '🫚',
    'Nagaland': '🌶️',
    'Sikkim': '🌱',
    'Tripura': '🍍',
  };
  return emojis[state] || '🌿';
}

// Product Card Component
function ProductCard({ listing, onNavigate }: { listing: Listing; onNavigate: (section: string) => void }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col" onClick={() => onNavigate('marketplace')}>
        <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center relative overflow-hidden">
          <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
            {getCategoryIcon(listing.category)}
          </span>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {listing.isOrganic && (
              <Badge className="bg-emerald-500 text-white text-xs">
                <Leaf className="h-3 w-3 mr-1" /> Organic
              </Badge>
            )}
            {listing.isVerified && (
              <Badge className="bg-blue-500 text-white text-xs">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          {/* State Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-white/90 text-emerald-700 text-xs">
              {getStateEmoji(listing.state)} {listing.state}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <p className="text-xs text-muted-foreground mb-1">{listing.district}, {listing.state}</p>
          <h3 className="font-semibold mb-2 line-clamp-2 flex-1">{listing.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                {listing.seller.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">{listing.seller.name}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div>
              <p className="text-lg font-bold text-emerald-600">₹{listing.price}</p>
              <p className="text-xs text-muted-foreground">per {listing.unit}</p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default HomeSection;
