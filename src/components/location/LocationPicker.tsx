'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Crosshair,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  Store,
  Edit2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { NE_STATES, NE_DISTRICTS } from '@/types';
import {
  useGeolocation,
  NE_INDIA_LOCATIONS,
  searchNELocations,
  calculateDistance,
  formatDistance,
} from '@/hooks/use-geolocation';

export interface SelectedLocation {
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  type: 'current' | 'search' | 'manual';
}

interface LocationPickerProps {
  value?: SelectedLocation | null;
  onChange: (location: SelectedLocation | null) => void;
  trigger?: React.ReactNode;
  showElevation?: boolean;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  trigger,
  showElevation = true,
  placeholder = 'Select delivery location',
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const {
    location: currentLocation,
    error: geoError,
    loading: geoLoading,
    permissionStatus,
    requestLocation,
  } = useGeolocation();

  // Search results
  const searchResults = searchQuery.length >= 2 ? searchNELocations(searchQuery) : [];

  // Handle current location selection
  const handleUseCurrentLocation = useCallback(() => {
    if (currentLocation) {
      // Find nearest known location
      const nearest = NE_INDIA_LOCATIONS.reduce((prev, curr) => {
        const prevDist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          prev.lat,
          prev.lng
        );
        const currDist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          curr.lat,
          curr.lng
        );
        return currDist < prevDist ? curr : prev;
      });

      onChange({
        name: `Near ${nearest.name}`,
        district: nearest.district,
        state: nearest.state,
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        type: 'current',
      });
      setOpen(false);
    } else {
      requestLocation();
    }
  }, [currentLocation, onChange, requestLocation]);

  // Handle search result selection
  const handleSelectLocation = (location: typeof NE_INDIA_LOCATIONS[0]) => {
    onChange({
      name: location.name,
      district: location.district,
      state: location.state,
      lat: location.lat,
      lng: location.lng,
      type: 'search',
    });
    setOpen(false);
    setSearchQuery('');
  };

  // Handle manual coordinate entry
  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }

    // Find nearest known location
    const nearest = NE_INDIA_LOCATIONS.reduce((prev, curr) => {
      const prevDist = calculateDistance(lat, lng, prev.lat, prev.lng);
      const currDist = calculateDistance(lat, lng, curr.lat, curr.lng);
      return currDist < prevDist ? curr : prev;
    });

    onChange({
      name: selectedDistrict || `Near ${nearest.name}`,
      district: selectedDistrict || nearest.district,
      state: selectedState || nearest.state,
      lat,
      lng,
      type: 'manual',
    });
    setOpen(false);
    setManualMode(false);
    setManualLat('');
    setManualLng('');
  };

  // Handle state/district selection
  const handleDistrictSelect = () => {
    if (!selectedState || !selectedDistrict) return;

    // Find location data for the district
    const location = NE_INDIA_LOCATIONS.find(
      loc => loc.state === selectedState && loc.district === selectedDistrict
    );

    if (location) {
      handleSelectLocation(location);
    } else {
      // Use state capital as fallback
      const capital = NE_INDIA_LOCATIONS.find(
        loc => loc.state === selectedState && loc.type === 'capital'
      );
      if (capital) {
        onChange({
          name: selectedDistrict,
          district: selectedDistrict,
          state: selectedState,
          lat: capital.lat,
          lng: capital.lng,
          type: 'search',
        });
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start gap-2">
            <MapPin className="h-4 w-4" />
            {value ? value.name : placeholder}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Select Delivery Location
          </DialogTitle>
          <DialogDescription>
            Choose where you want your order delivered
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Location Option */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
              >
                {geoLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Crosshair className="h-5 w-5 text-emerald-600" />
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium">Use Current Location</div>
                  <div className="text-sm text-muted-foreground">
                    {geoLoading
                      ? 'Getting location...'
                      : permissionStatus === 'denied'
                      ? 'Location permission denied'
                      : 'Detect your location automatically'}
                  </div>
                </div>
              </Button>
              {geoError && (
                <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {geoError.message}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or search by location
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search district, city, or market..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <Card>
              <ScrollArea className="h-48">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((location, index) => (
                      <button
                        key={`${location.name}-${index}`}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectLocation(location)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {location.type === 'capital' ? (
                              <Building2 className="h-4 w-4" />
                            ) : location.type === 'market' ? (
                              <Store className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {location.district}, {location.state}
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {location.type}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No locations found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </ScrollArea>
            </Card>
          )}

          {/* State/District Selection */}
          {!manualMode && searchQuery.length < 2 && (
            <div className="space-y-3">
              <Label>Select by State & District</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {NE_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={!selectedState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    {(NE_DISTRICTS[selectedState] || []).map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedState && selectedDistrict && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleDistrictSelect}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Location
                </Button>
              )}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Advanced
              </span>
            </div>
          </div>

          {/* Manual Coordinate Entry */}
          {!manualMode ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setManualMode(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Enter Coordinates Manually
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Manual Coordinates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      placeholder="e.g., 27.0844"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      placeholder="e.g., 93.6053"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Coordinates should be within Northeast India region
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setManualMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleManualSubmit}
                    disabled={!manualLat || !manualLng}
                  >
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact Location Badge Component
interface LocationBadgeProps {
  location: SelectedLocation | null;
  onClick?: () => void;
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export function LocationBadge({
  location,
  onClick,
  showDistance = false,
  userLocation,
}: LocationBadgeProps) {
  if (!location) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={onClick}
      >
        <MapPin className="h-3.5 w-3.5" />
        Set Location
      </Button>
    );
  }

  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
    : null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={onClick}
    >
      {location.type === 'current' ? (
        <Navigation className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
      )}
      <span className="max-w-32 truncate">{location.name}</span>
      {showDistance && distance !== null && (
        <Badge variant="secondary" className="ml-1 text-xs">
          {formatDistance(distance)}
        </Badge>
      )}
    </Button>
  );
}

export default LocationPicker;
