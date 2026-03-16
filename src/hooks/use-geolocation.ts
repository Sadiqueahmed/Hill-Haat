'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationReturn extends GeoLocation {
  requestLocation: () => void;
  hasPermission: boolean | null;
  distanceFrom: (lat: number, lng: number) => number | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
        setHasPermission(true);
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            setHasPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocation(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  // Calculate distance using Haversine formula
  const distanceFrom = useCallback((targetLat: number, targetLng: number): number | null => {
    if (location.latitude === null || location.longitude === null) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(targetLat - location.latitude);
    const dLng = toRad(targetLng - location.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(location.latitude)) * Math.cos(toRad(targetLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }, [location.latitude, location.longitude]);

  // Auto-request location on mount (optional)
  useEffect(() => {
    // Check if permission was previously granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, [requestLocation]);

  return {
    ...location,
    requestLocation,
    hasPermission,
    distanceFrom,
  };
}

// Convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Format distance for display
export function formatDistance(distance: number | null): string {
  if (distance === null) return '';
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  if (distance < 10) return `${distance.toFixed(1)}km`;
  return `${Math.round(distance)}km`;
}

// Check if location is within NE India bounds
export function isInNEIndia(lat: number, lng: number): boolean {
  // NE India approximate bounds
  const bounds = {
    north: 29.5,
    south: 21.5,
    east: 97.5,
    west: 88.0,
  };
  
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

// Get state from coordinates (approximate)
export function getStateFromCoords(lat: number, lng: number): string | null {
  // Approximate state boundaries - simplified
  if (lat >= 27.0 && lat <= 28.3 && lng >= 88.0 && lng <= 89.0) return 'Sikkim';
  if (lat >= 25.5 && lat <= 27.5 && lng >= 89.5 && lng <= 93.0) return 'Arunachal Pradesh';
  if (lat >= 24.0 && lat <= 28.0 && lng >= 89.5 && lng <= 96.5) return 'Assam';
  if (lat >= 23.0 && lat <= 25.7 && lng >= 92.0 && lng <= 94.8) return 'Manipur';
  if (lat >= 25.0 && lat <= 26.2 && lng >= 89.8 && lng <= 92.8) return 'Meghalaya';
  if (lat >= 21.5 && lat <= 24.5 && lng >= 92.0 && lng <= 93.5) return 'Mizoram';
  if (lat >= 25.5 && lat <= 27.0 && lng >= 93.3 && lng <= 95.0) return 'Nagaland';
  if (lat >= 22.5 && lat <= 24.5 && lng >= 91.0 && lng <= 92.5) return 'Tripura';
  
  return null;
}
