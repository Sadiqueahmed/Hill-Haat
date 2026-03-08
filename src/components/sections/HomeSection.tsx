'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  ArrowRight, Leaf, Mountain, User, Truck, Package, Star, MapPin,
  TrendingUp, Clock, Shield, Award, ChevronRight, Play, Quote,
  CheckCircle, Sprout, Globe, Heart, Zap, Phone, Mail, Twitter,
  Facebook, Instagram, Youtube, ArrowUpRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';

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

// API helper
const api = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return response.json();
};

// Main Component
export function HomeSection({ onNavigate }: HomeSectionProps) {
  const { isSignedIn } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

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
      {/* Hero Section with Parallax */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          {/* Floating Elements */}
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
            🍎
          </motion.div>
        </div>

        <motion.div style={{ y: heroY }} className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-emerald-100 text-sm font-medium">
                  🌱 2,500+ Farmers Trust Us
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                Fresh from the{' '}
                <span className="relative">
                  <span className="relative z-10 text-emerald-200">Hills</span>
                  <motion.span
                    className="absolute bottom-2 left-0 w-full h-3 bg-emerald-400/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
                <br />
                to Your Doorstep
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100 mb-8 leading-relaxed max-w-xl">
                Connect directly with verified farmers from Northeast India&apos;s pristine hilly regions. 
                Get authentic organic produce, rare spices, and exotic fruits at fair prices.
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

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                {[
                  { icon: Shield, label: 'Verified Sellers' },
                  { icon: Leaf, label: '100% Organic' },
                  { icon: Truck, label: 'Pan-India Delivery' },
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

            {/* Right Content - Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              {[
                { icon: Leaf, value: '2,500+', label: 'Organic Products', color: 'from-green-400 to-emerald-500', delay: 0.5 },
                { icon: Mountain, value: '8 States', label: 'Hill Regions', color: 'from-teal-400 to-cyan-500', delay: 0.6 },
                { icon: User, value: '1,200+', label: 'Verified Farmers', color: 'from-amber-400 to-orange-500', delay: 0.7 },
                { icon: Truck, value: '15K+', label: 'Orders Delivered', color: 'from-purple-400 to-pink-500', delay: 0.8 },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: stat.delay }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10"
                >
                  <div className={cn('inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br mb-4 shadow-lg', stat.color)}>
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-emerald-200 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
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

      {/* Categories Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">
              Browse Categories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Explore Fresh Produce
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover authentic products from the pristine hills of Northeast India
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryStats.map((cat, index) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cursor-pointer"
                onClick={() => onNavigate('marketplace')}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
                  <CardContent className="p-6 text-center relative">
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity',
                      `bg-gradient-to-br ${cat.color}`
                    )} />
                    <div className="text-4xl mb-3 relative z-10">{cat.icon}</div>
                    <p className="font-semibold mb-1 relative z-10">{cat.label}</p>
                    <p className="text-sm text-muted-foreground relative z-10">{cat.count}+ items</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
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

      {/* Why Choose Us */}
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
              The Smarter Way to Buy Fresh
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We bridge the gap between farmers and consumers with transparency and trust
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Verified Sellers',
                description: 'Every farmer is verified through our rigorous process. Know exactly who grows your food.',
                color: 'text-blue-600 bg-blue-100',
              },
              {
                icon: Leaf,
                title: 'Organic Certified',
                description: 'Trace organic products from farm to table with verified certifications.',
                color: 'text-emerald-600 bg-emerald-100',
              },
              {
                icon: MapPin,
                title: 'Geographic Origin',
                description: 'Know exactly where your food comes from with GPS-tagged origins.',
                color: 'text-amber-600 bg-amber-100',
              },
              {
                icon: Truck,
                title: 'Smart Logistics',
                description: 'Terrain-aware delivery optimized for Northeast India\'s unique geography.',
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

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="0.5" fill="white"/>
            </pattern>
            <rect width="100" height="100" fill="url(#dots)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-white/20 text-white mb-4">
              <Heart className="h-3 w-3 mr-1" /> Loved by Customers
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-emerald-100 max-w-2xl mx-auto">
              Real stories from our growing community of farmers and buyers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Hill-Haat transformed my farming business. I now sell directly to customers across India and earn 40% more than before!",
                name: "Rahul Sharma",
                role: "Organic Farmer, Tripura",
                rating: 5,
                image: "👨‍🌾",
              },
              {
                quote: "The quality of products is exceptional. I can trace every item back to the farmer. This transparency is exactly what I was looking for.",
                name: "Priya Devi",
                role: "Restaurant Owner, Guwahati",
                rating: 5,
                image: "👩‍🍳",
              },
              {
                quote: "As a logistics partner, I appreciate the terrain-aware routing. It makes deliveries efficient even in the hilly regions.",
                name: "Rajesh Singh",
                role: "Delivery Partner, Assam",
                rating: 5,
                image: "🚚",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
              >
                <Quote className="h-8 w-8 text-emerald-300 mb-4" />
                <p className="text-lg mb-6 text-emerald-50">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-emerald-200">{testimonial.role}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
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
                { name: "Rahul Sharma", location: "West Tripura, Tripura", rating: 4.8, reviews: 23, products: 5 },
                { name: "Tashi Dorjee", location: "East Sikkim, Sikkim", rating: 4.9, reviews: 18, products: 3 },
                { name: "Limasen Ao", location: "Mokokchung, Nagaland", rating: 4.6, reviews: 15, products: 4 },
                { name: "Priya Devi", location: "Imphal West, Manipur", rating: 4.7, reviews: 31, products: 6 },
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
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
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
              Get started in minutes with our simple 3-step process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            
            {[
              {
                step: '01',
                title: 'Browse & Discover',
                description: 'Explore thousands of fresh products from verified farmers across Northeast India\'s pristine hills.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Place Your Order',
                description: 'Select your products, specify quantity, and place your order with secure payment options.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Track & Receive',
                description: 'Track your order in real-time as it travels from the hills to your doorstep.',
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
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
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
              Stay Updated
            </h2>
            <p className="text-muted-foreground mb-8">
              Get notified about new products, seasonal offers, and farmer stories directly in your inbox.
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
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Join Hill-Haat?
              </h2>
              <p className="text-emerald-100 max-w-2xl mx-auto mb-8 text-lg">
                Whether you&apos;re a farmer looking to reach more customers or a buyer seeking authentic produce, 
                Hill-Haat connects you directly.
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
          <div className="flex items-center justify-between mt-auto pt-2 border-t">
            <div>
              <span className="text-xl font-bold text-emerald-600">₹{listing.price}</span>
              <span className="text-sm text-muted-foreground">/{listing.unit}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{listing.avgRating?.toFixed(1) || listing.seller.rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default HomeSection;
