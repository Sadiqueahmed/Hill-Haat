'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Category, CATEGORY_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  count: number;
  index?: number;
}

const categoryIcons: Record<Category, string> = {
  SPICES: '🌿',
  FRUITS: '🍎',
  VEGETABLES: '🥬',
  GRAINS: '🌾',
  DAIRY: '🥛',
  HERBS: '🌱',
  BAMBOO_PRODUCTS: '🎋',
  HANDICRAFTS: '🧺',
  TEA: '🍵',
  HONEY: '🍯',
  OTHER: '📦',
};

const categoryColors: Record<Category, { bg: string; text: string; hover: string }> = {
  SPICES: { bg: 'bg-amber-50', text: 'text-amber-800', hover: 'hover:bg-amber-100' },
  FRUITS: { bg: 'bg-pink-50', text: 'text-pink-800', hover: 'hover:bg-pink-100' },
  VEGETABLES: { bg: 'bg-green-50', text: 'text-green-800', hover: 'hover:bg-green-100' },
  GRAINS: { bg: 'bg-orange-50', text: 'text-orange-800', hover: 'hover:bg-orange-100' },
  DAIRY: { bg: 'bg-blue-50', text: 'text-blue-800', hover: 'hover:bg-blue-100' },
  HERBS: { bg: 'bg-emerald-50', text: 'text-emerald-800', hover: 'hover:bg-emerald-100' },
  BAMBOO_PRODUCTS: { bg: 'bg-lime-50', text: 'text-lime-800', hover: 'hover:bg-lime-100' },
  HANDICRAFTS: { bg: 'bg-purple-50', text: 'text-purple-800', hover: 'hover:bg-purple-100' },
  TEA: { bg: 'bg-teal-50', text: 'text-teal-800', hover: 'hover:bg-teal-100' },
  HONEY: { bg: 'bg-yellow-50', text: 'text-yellow-800', hover: 'hover:bg-yellow-100' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-800', hover: 'hover:bg-slate-100' },
};

export function CategoryCard({ category, count, index = 0 }: CategoryCardProps) {
  const colors = categoryColors[category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/marketplace?category=${category}`}>
        <Card className={cn(
          'group cursor-pointer border-0 shadow-sm transition-all duration-300 hover:shadow-lg',
          colors.bg,
          colors.hover
        )}>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
              {categoryIcons[category]}
            </div>
            <h3 className={cn('font-semibold mb-1', colors.text)}>
              {CATEGORY_LABELS[category]}
            </h3>
            <p className="text-sm text-muted-foreground">
              {count.toLocaleString()} products
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
