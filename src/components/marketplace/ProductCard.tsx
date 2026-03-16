'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Leaf,
  Clock,
  ShoppingCart,
  Heart,
  Navigation,
  Mountain,
  Truck,
  Route,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Listing, CATEGORY_LABELS, QUALITY_LABELS, TERRAIN_INFO } from '@/types';
import { cn } from '@/lib/utils';
import { VerifiedBadge, VerifiedSellerBadge } from '@/components/verification/VerifiedBadge';
import { formatDistance } from '@/hooks/use-geolocation';

interface ProductCardProps {
  listing: Listing & {
    distance?: number | null;
    elevation?: number | null;
    nearestHighway?: string | null;
    nearestMarket?: string | null;
    terrainType?: string | null;
    connectivityScore?: number | null;
    avgRating?: number;
    reviewCount?: number;
  };
  index?: number;
  viewMode?: 'grid' | 'list';
  showDistance?: boolean;
  onAddToCart?: (listingId: string, quantity: number) => void;
  onOrder?: (listing: ProductCardProps['listing']) => void;
  onView?: (listing: ProductCardProps['listing']) => void;
}

export function ProductCard({
  listing,
  index = 0,
  viewMode = 'grid',
  showDistance = true,
  onAddToCart,
  onOrder,
  onView,
}: ProductCardProps) {
  const categoryColors: Record<string, string> = {
    SPICES: 'bg-amber-100 text-amber-800',
    FRUITS: 'bg-pink-100 text-pink-800',
    VEGETABLES: 'bg-green-100 text-green-800',
    GRAINS: 'bg-orange-100 text-orange-800',
    DAIRY: 'bg-blue-100 text-blue-800',
    HERBS: 'bg-emerald-100 text-emerald-800',
    BAMBOO_PRODUCTS: 'bg-lime-100 text-lime-800',
    HANDICRAFTS: 'bg-purple-100 text-purple-800',
    TEA: 'bg-teal-100 text-teal-800',
    HONEY: 'bg-yellow-100 text-yellow-800',
    OTHER: 'bg-slate-100 text-slate-800',
  };

  const terrainColors: Record<string, string> = {
    PLAIN: 'bg-green-100 text-green-700',
    HILLY: 'bg-amber-100 text-amber-700',
    MOUNTAINOUS: 'bg-purple-100 text-purple-700',
    VALLEY: 'bg-blue-100 text-blue-700',
    MIXED: 'bg-slate-100 text-slate-700',
    RIVERINE: 'bg-cyan-100 text-cyan-700',
  };

  // Check if delivery is available based on connectivity score
  const isDeliveryAvailable = (listing.connectivityScore ?? 5) >= 3;
  
  // Get terrain info
  const terrainInfo = listing.terrainType && TERRAIN_INFO[listing.terrainType as keyof typeof TERRAIN_INFO];
  
  // Get elevation zone label
  const getElevationLabel = (elevation: number | null | undefined): string => {
    if (!elevation) return '';
    if (elevation < 300) return 'Lowland';
    if (elevation < 1000) return 'Foothills';
    if (elevation < 2000) return 'Highland';
    return 'Mountain';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Image placeholder */}
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shrink-0">
                <div className="text-3xl opacity-30">
                  {listing.category === 'SPICES' && '🌿'}
                  {listing.category === 'FRUITS' && '🍎'}
                  {listing.category === 'VEGETABLES' && '🥬'}
                  {listing.category === 'GRAINS' && '🌾'}
                  {listing.category === 'DAIRY' && '🥛'}
                  {listing.category === 'HERBS' && '🌱'}
                  {listing.category === 'BAMBOO_PRODUCTS' && '🎋'}
                  {listing.category === 'HANDICRAFTS' && '🧺'}
                  {listing.category === 'TEA' && '🍵'}
                  {listing.category === 'HONEY' && '🍯'}
                  {listing.category === 'OTHER' && '📦'}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{listing.district}, {listing.state}</span>
                      {showDistance && listing.distance !== null && listing.distance !== undefined && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {formatDistance(listing.distance)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-emerald-600">₹{listing.price}</div>
                    <div className="text-xs text-muted-foreground">/{listing.unit}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  {listing.isOrganic && (
                    <Badge className="bg-emerald-500 text-white text-xs">
                      <Leaf className="h-3 w-3 mr-1" />
                      Organic
                    </Badge>
                  )}
                  {listing.terrainType && (
                    <Badge variant="outline" className="text-xs">
                      <Mountain className="h-3 w-3 mr-1" />
                      {terrainInfo?.name || listing.terrainType}
                    </Badge>
                  )}
                  {listing.elevation && (
                    <Badge variant="outline" className="text-xs">
                      {getElevationLabel(listing.elevation)} ({listing.elevation}m)
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onAddToCart?.(listing.id, 1)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onOrder?.(listing)}
                  >
                    Order Now
                  </Button>
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
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
          {/* Placeholder Image Pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-20">
              {listing.category === 'SPICES' && '🌿'}
              {listing.category === 'FRUITS' && '🍎'}
              {listing.category === 'VEGETABLES' && '🥬'}
              {listing.category === 'GRAINS' && '🌾'}
              {listing.category === 'DAIRY' && '🥛'}
              {listing.category === 'HERBS' && '🌱'}
              {listing.category === 'BAMBOO_PRODUCTS' && '🎋'}
              {listing.category === 'HANDICRAFTS' && '🧺'}
              {listing.category === 'TEA' && '🍵'}
              {listing.category === 'HONEY' && '🍯'}
              {listing.category === 'OTHER' && '📦'}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className={cn('font-medium', categoryColors[listing.category])}>
              {CATEGORY_LABELS[listing.category]}
            </Badge>
            {listing.isOrganic && (
              <Badge className="bg-emerald-500 text-white gap-1">
                <Leaf className="h-3 w-3" />
                Organic
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Distance Badge */}
          {showDistance && listing.distance !== null && listing.distance !== undefined && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/95 text-emerald-700 shadow-sm gap-1">
                <Navigation className="h-3 w-3" />
                {formatDistance(listing.distance)} away
              </Badge>
            </div>
          )}

          {/* Quality Badge */}
          {listing.quality === 'A_PLUS' && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-amber-500 text-white gap-1">
                <Star className="h-3 w-3 fill-current" />
                Premium
              </Badge>
            </div>
          )}

          {/* Verified Product Badge */}
          {listing.isVerified && (
            <div className="absolute top-14 right-3">
              <VerifiedBadge status="APPROVED" showLabel={false} size="sm" />
            </div>
          )}

          {/* Delivery Availability Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "absolute top-14 left-3",
                  !isDeliveryAvailable && "cursor-help"
                )}>
                  <Badge className={cn(
                    "gap-1",
                    isDeliveryAvailable 
                      ? "bg-blue-500 text-white" 
                      : "bg-amber-500 text-white"
                  )}>
                    <Truck className="h-3 w-3" />
                    {isDeliveryAvailable ? 'Delivery' : 'Limited'}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isDeliveryAvailable 
                  ? 'Delivery available to your location'
                  : 'Limited delivery - remote area with low connectivity'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          {/* Title */}
          <h3 
            className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors cursor-pointer"
            onClick={() => onView?.(listing)}
          >
            {listing.title}
          </h3>

          {/* Location with Distance */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            <span>{listing.district}, {listing.state}</span>
          </div>

          {/* Location Details Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.terrainType && terrainInfo && (
              <Badge variant="outline" className={cn('text-xs', terrainColors[listing.terrainType] || '')}>
                <Mountain className="h-3 w-3 mr-1" />
                {terrainInfo.name}
              </Badge>
            )}
            {listing.elevation && (
              <Badge variant="outline" className="text-xs">
                ↑ {listing.elevation}m
              </Badge>
            )}
            {listing.connectivityScore && listing.connectivityScore < 4 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Remote
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Low connectivity area (Score: {listing.connectivityScore}/10)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Nearest Highway/Market Info */}
          {(listing.nearestHighway || listing.nearestMarket) && (
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
              {listing.nearestHighway && (
                <div className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  <span>Near: {listing.nearestHighway.split(',')[0]}</span>
                </div>
              )}
              {listing.nearestMarket && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Market: {listing.nearestMarket}</span>
                </div>
              )}
            </div>
          )}

          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
              {listing.seller.name.charAt(0)}
            </div>
            <span className="text-sm text-muted-foreground">{listing.seller.name}</span>
            {listing.seller.isVerified && (
              <VerifiedSellerBadge isVerified={true} size="sm" showLabel={false} />
            )}
            {(listing.avgRating ?? listing.seller.rating) > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                <span className="text-sm font-medium">
                  {(listing.avgRating ?? listing.seller.rating).toFixed(1)}
                </span>
                {listing.reviewCount && (
                  <span className="text-xs text-muted-foreground">({listing.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Price and Action */}
          <div className="flex items-end justify-between pt-3 border-t">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-600">₹{listing.price}</span>
                <span className="text-sm text-muted-foreground">/{listing.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Min. order: {listing.minOrder} {listing.unit}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onView?.(listing)}
              >
                View
              </Button>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onAddToCart?.(listing.id, 1)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Harvest Date */}
          {listing.harvestDate && (
            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Harvested: {new Date(listing.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
