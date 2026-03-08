'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Leaf,
  Shield,
  Clock,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Listing, CATEGORY_LABELS, QUALITY_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  listing: Listing;
  index?: number;
}

export function ProductCard({ listing, index = 0 }: ProductCardProps) {
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

          {/* Quality Badge */}
          {listing.quality === 'A_PLUS' && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-amber-500 text-white gap-1">
                <Star className="h-3 w-3 fill-current" />
                Premium
              </Badge>
            </div>
          )}

          {/* Verified Badge */}
          {listing.isVerified && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-emerald-600 text-white gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          {/* Title */}
          <Link href={`/marketplace/${listing.id}`}>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
              {listing.title}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            <span>{listing.district}, {listing.state}</span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
              {listing.seller.name.charAt(0)}
            </div>
            <span className="text-sm text-muted-foreground">{listing.seller.name}</span>
            {listing.seller.isVerified && (
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {listing.seller.rating > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                <span className="text-sm font-medium">{listing.seller.rating.toFixed(1)}</span>
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
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
