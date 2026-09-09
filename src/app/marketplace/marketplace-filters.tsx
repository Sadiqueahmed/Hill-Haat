"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORY_LABELS, NE_STATES } from "@/types";

interface MarketplaceFiltersProps {
  currentFilters: Record<string, string | undefined>;
}

export function MarketplaceFilters({ currentFilters }: MarketplaceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(currentFilters.search || "");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");

  function applyFilters(overrides: Record<string, string | undefined> = {}) {
    const next = { ...currentFilters, search, minPrice, maxPrice, ...overrides };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6 sticky top-24">
      <div>
        <Label htmlFor="search" className="mb-2 block">Search</Label>
        <Input
          id="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
      </div>

      <div>
        <Label className="mb-2 block">Category</Label>
        <Select
          value={currentFilters.category || "all"}
          onValueChange={(value) => applyFilters({ category: value === "all" ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">State</Label>
        <Select
          value={currentFilters.state || "all"}
          onValueChange={(value) => applyFilters({ state: value === "all" ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {NE_STATES.map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Price range (₹)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            placeholder="Max"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="organic"
          checked={currentFilters.isOrganic === "true"}
          onCheckedChange={(checked) => applyFilters({ isOrganic: checked ? "true" : undefined })}
        />
        <Label htmlFor="organic">Organic only</Label>
      </div>

      <div>
        <Label className="mb-2 block">Sort by</Label>
        <Select
          value={currentFilters.sortBy || "createdAt"}
          onValueChange={(value) => applyFilters({ sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="viewCount">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={() => applyFilters()} className="w-full bg-emerald-600 hover:bg-emerald-700">
        Apply Filters
      </Button>
    </div>
  );
}