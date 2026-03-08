'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Mountain, Truck, Clock, AlertTriangle, CheckCircle,
  ChevronDown, Info, Zap, CloudRain, Thermometer, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NE_STATES } from '@/types';

interface DeliveryEstimate {
  distance: number;
  timeMinutes: number;
  timeFormatted: string;
  terrainType: string;
  difficultyScore: number;
  baseCost: number;
  terrainMultiplier: number;
  weatherMultiplier: number;
  totalCost: number;
}

interface LocationInfo {
  district: string;
  state: string;
  terrain: string;
  elevation: number;
  connectivity: number;
}

interface Hazard {
  type: string;
  severity: string;
  description: string;
}

interface EstimateResult {
  pickup: LocationInfo;
  delivery: LocationInfo;
  estimate: DeliveryEstimate;
  hazards: Hazard[];
  recommendations: string[];
  isShadowZone: boolean;
}

const TERRAIN_ICONS: Record<string, string> = {
  PLAIN: '🌾',
  HILLY: '⛰️',
  MOUNTAINOUS: '🏔️',
  VALLEY: '🏞️',
  MIXED: '🛤️',
};

const TERRAIN_LABELS: Record<string, string> = {
  PLAIN: 'Plain Terrain',
  HILLY: 'Hilly Terrain',
  MOUNTAINOUS: 'Mountainous',
  VALLEY: 'Valley',
  MIXED: 'Mixed Terrain',
};

export function DeliveryEstimator() {
  const [pickupState, setPickupState] = useState('');
  const [pickupDistrict, setPickupDistrict] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');
  const [weight, setWeight] = useState('1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState('');

  const [districts, setDistricts] = useState<Record<string, string[]>>({});

  // Fetch districts when state changes
  useEffect(() => {
    async function fetchDistricts() {
      if (pickupState) {
        try {
          const res = await fetch(`/api/logistics?action=districts&state=${encodeURIComponent(pickupState)}`);
          const data = await res.json();
          if (data.success) {
            setDistricts(prev => ({ ...prev, [pickupState]: data.data.map((d: { name: string }) => d.name) }));
          }
        } catch (e) {
          console.error('Failed to fetch pickup districts');
        }
      }
    }
    fetchDistricts();
  }, [pickupState]);

  useEffect(() => {
    async function fetchDistricts() {
      if (deliveryState) {
        try {
          const res = await fetch(`/api/logistics?action=districts&state=${encodeURIComponent(deliveryState)}`);
          const data = await res.json();
          if (data.success) {
            setDistricts(prev => ({ ...prev, [deliveryState]: data.data.map((d: { name: string }) => d.name) }));
          }
        } catch (e) {
          console.error('Failed to fetch delivery districts');
        }
      }
    }
    fetchDistricts();
  }, [deliveryState]);

  const handleEstimate = async () => {
    if (!pickupState || !pickupDistrict || !deliveryState || !deliveryDistrict) {
      setError('Please select all locations');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'estimate',
          pickupState,
          pickupDistrict,
          deliveryState,
          deliveryDistrict,
          weightKg: parseFloat(weight) || 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to calculate estimate');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'CRITICAL': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Smart Delivery Estimator
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Terrain-aware delivery cost & time estimation for Northeast India
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Location Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pickup Location */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Pickup Location
            </h4>
            <div className="space-y-3">
              <div>
                <Label>State</Label>
                <Select value={pickupState} onValueChange={setPickupState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NE_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>District</Label>
                <Select value={pickupDistrict} onValueChange={setPickupDistrict} disabled={!pickupState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {(districts[pickupState] || []).map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              Delivery Location
            </h4>
            <div className="space-y-3">
              <div>
                <Label>State</Label>
                <Select value={deliveryState} onValueChange={setDeliveryState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NE_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>District</Label>
                <Select value={deliveryDistrict} onValueChange={setDeliveryDistrict} disabled={!deliveryState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {(districts[deliveryState] || []).map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Weight Input */}
        <div className="max-w-xs">
          <Label>Package Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            min="0.1"
            step="0.1"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button
          onClick={handleEstimate}
          disabled={loading || !pickupState || !pickupDistrict || !deliveryState || !deliveryDistrict}
          className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Calculating...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Get Delivery Estimate
            </>
          )}
        </Button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Separator />

              {/* Shadow Zone Warning */}
              {result.isShadowZone && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Low Connectivity Zone Detected</p>
                    <p className="text-sm text-amber-700">This route passes through areas with limited connectivity. Offline navigation may be required.</p>
                  </div>
                </div>
              )}

              {/* Location Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <p className="font-semibold">{result.pickup.district}, {result.pickup.state}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span>{TERRAIN_ICONS[result.pickup.terrain]} {TERRAIN_LABELS[result.pickup.terrain]}</span>
                    <span>•</span>
                    <span>📡 {result.pickup.connectivity}/10 connectivity</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">To</p>
                  <p className="font-semibold">{result.delivery.district}, {result.delivery.state}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span>{TERRAIN_ICONS[result.delivery.terrain]} {TERRAIN_LABELS[result.delivery.terrain]}</span>
                    <span>•</span>
                    <span>📡 {result.delivery.connectivity}/10 connectivity</span>
                  </div>
                </div>
              </div>

              {/* Estimate Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">📏</div>
                    <p className="text-2xl font-bold text-emerald-700">{result.estimate.distance}</p>
                    <p className="text-sm text-muted-foreground">km distance</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">⏱️</div>
                    <p className="text-2xl font-bold text-emerald-700">{result.estimate.timeFormatted}</p>
                    <p className="text-sm text-muted-foreground">estimated time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">{TERRAIN_ICONS[result.estimate.terrainType]}</div>
                    <p className="text-2xl font-bold text-emerald-700">{result.estimate.difficultyScore}/10</p>
                    <p className="text-sm text-muted-foreground">difficulty score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">💰</div>
                    <p className="text-2xl font-bold text-emerald-700">₹{result.estimate.totalCost}</p>
                    <p className="text-sm text-muted-foreground">delivery cost</p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-sm text-muted-foreground">
                    Base: ₹{result.estimate.baseCost} • 
                    Terrain: {result.estimate.terrainMultiplier}x • 
                    Weather: {result.estimate.weatherMultiplier}x
                  </p>
                </div>
              </div>

              {/* Hazards */}
              {result.hazards.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Route Hazards
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.hazards.map((hazard, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn('px-3 py-1', getSeverityColor(hazard.severity))}
                      >
                        {hazard.type}: {hazard.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-600 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
