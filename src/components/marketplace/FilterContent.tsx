'use client';

import { X, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { CATEGORY_LABELS, NE_STATES, Category } from '@/types';

interface FilterContentProps {
  selectedCategories: Category[];
  selectedStates: string[];
  priceRange: number[];
  showOrganicOnly: boolean;
  showVerifiedOnly: boolean;
  activeFiltersCount: number;
  onToggleCategory: (category: Category) => void;
  onToggleState: (state: string) => void;
  onPriceChange: (value: number[]) => void;
  onToggleOrganic: (value: boolean) => void;
  onToggleVerified: (value: boolean) => void;
  onClearFilters: () => void;
}

export function FilterContent({
  selectedCategories,
  selectedStates,
  priceRange,
  showOrganicOnly,
  showVerifiedOnly,
  activeFiltersCount,
  onToggleCategory,
  onToggleState,
  onPriceChange,
  onToggleOrganic,
  onToggleVerified,
  onClearFilters,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-3">Categories</h4>
        <div className="space-y-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${key}`}
                checked={selectedCategories.includes(key as Category)}
                onCheckedChange={() => onToggleCategory(key as Category)}
              />
              <Label htmlFor={`cat-${key}`} className="text-sm font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* States */}
      <div>
        <h4 className="font-semibold mb-3">Location (State)</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {NE_STATES.map((state) => (
            <div key={state} className="flex items-center gap-2">
              <Checkbox
                id={`state-${state}`}
                checked={selectedStates.includes(state)}
                onCheckedChange={() => onToggleState(state)}
              />
              <Label htmlFor={`state-${state}`} className="text-sm font-normal cursor-pointer">
                {state}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3">Price Range (per unit)</h4>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={onPriceChange}
            max={2000}
            step={50}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quick Filters */}
      <div>
        <h4 className="font-semibold mb-3">Quick Filters</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="organic"
              checked={showOrganicOnly}
              onCheckedChange={(checked) => onToggleOrganic(checked as boolean)}
            />
            <Label htmlFor="organic" className="text-sm font-normal cursor-pointer flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500" />
              Organic Only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified"
              checked={showVerifiedOnly}
              onCheckedChange={(checked) => onToggleVerified(checked as boolean)}
            />
            <Label htmlFor="verified" className="text-sm font-normal cursor-pointer">
              Verified Sellers Only
            </Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={onClearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
