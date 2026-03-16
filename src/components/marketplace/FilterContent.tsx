'use client';

import { X, Leaf, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CATEGORY_LABELS, NE_STATES, Category } from '@/types';

export type DeliveryRadius = '5' | '10' | '25' | '50' | 'all';

interface FilterContentProps {
  selectedCategories: Category[];
  selectedStates: string[];
  priceRange: number[];
  showOrganicOnly: boolean;
  showVerifiedOnly: boolean;
  activeFiltersCount: number;
  // Location-based filters
  userLocation: { lat: number; lng: number } | null;
  isLocating: boolean;
  nearMeEnabled: boolean;
  deliveryRadius: DeliveryRadius;
  onToggleCategory: (category: Category) => void;
  onToggleState: (state: string) => void;
  onPriceChange: (value: number[]) => void;
  onToggleOrganic: (value: boolean) => void;
  onToggleVerified: (value: boolean) => void;
  onClearFilters: () => void;
  // Location handlers
  onRequestLocation: () => void;
  onToggleNearMe: (enabled: boolean) => void;
  onRadiusChange: (radius: DeliveryRadius) => void;
}

export function FilterContent({
  selectedCategories,
  selectedStates,
  priceRange,
  showOrganicOnly,
  showVerifiedOnly,
  activeFiltersCount,
  userLocation,
  isLocating,
  nearMeEnabled,
  deliveryRadius,
  onToggleCategory,
  onToggleState,
  onPriceChange,
  onToggleOrganic,
  onToggleVerified,
  onClearFilters,
  onRequestLocation,
  onToggleNearMe,
  onRadiusChange,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Near Me / Location Filter */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-emerald-600" />
          Near Me
        </h4>
        <div className="space-y-3">
          {!userLocation ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onRequestLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Enable Location
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-sm">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Location enabled</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nearMe"
                  checked={nearMeEnabled}
                  onCheckedChange={(checked) => onToggleNearMe(checked as boolean)}
                />
                <Label htmlFor="nearMe" className="text-sm font-normal cursor-pointer">
                  Show nearest products first
                </Label>
              </div>
              
              {/* Delivery Radius Filter */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Delivery Range</Label>
                <RadioGroup
                  value={deliveryRadius}
                  onValueChange={(value) => onRadiusChange(value as DeliveryRadius)}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: 'all', label: 'All' },
                    { value: '5', label: '5 km' },
                    { value: '10', label: '10 km' },
                    { value: '25', label: '25 km' },
                    { value: '50', label: '50 km' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`radius-${option.value}`} />
                      <Label htmlFor={`radius-${option.value}`} className="text-sm font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-3">Categories</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
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
