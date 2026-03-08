import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import {
  calculateDeliveryEstimate,
  calculateElevationPenalty,
  calculateDifficultyScore,
  getCurrentSeason,
  getWeatherImpactMultiplier,
  type TerrainType,
  type RouteSegment,
  type HazardZone,
} from '@/lib/terrain-routing';
import { getDistrictData, getStateData, NE_STATES_DATA } from '@/lib/ne-india-data';

// GET /api/logistics - Get logistics info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'states') {
      // Return all NE states with summary info
      return NextResponse.json({
        success: true,
        data: NE_STATES_DATA.map(state => ({
          name: state.name,
          capital: state.capital,
          totalDistricts: state.totalDistricts,
          averageElevation: state.averageElevation,
          primaryTerrain: state.primaryTerrain,
          majorHighways: state.majorHighways,
        })),
      });
    }

    if (action === 'districts') {
      const state = searchParams.get('state');
      if (!state) {
        return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
      }
      
      const stateData = getStateData(state);
      if (!stateData) {
        return NextResponse.json({ error: 'State not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: stateData.districts.map(d => ({
          name: d.name,
          terrainType: d.terrainType,
          averageElevation: d.averageElevation,
          connectivityScore: d.connectivityScore,
          specialProduce: d.specialProduce,
          hazards: d.hazards,
          coordinates: d.coordinates,
        })),
      });
    }

    if (action === 'riders') {
      // Get available riders (for demo, return mock data)
      const district = searchParams.get('district');
      const riders = [
        { id: 'r1', name: 'Rajesh Kumar', vehicle: 'Bike', rating: 4.8, orders: 156, available: true },
        { id: 'r2', name: 'Amit Singh', vehicle: 'Tempo', rating: 4.6, orders: 89, available: true },
        { id: 'r3', name: 'Bimal Das', vehicle: 'Truck', rating: 4.9, orders: 234, available: false },
      ];
      
      return NextResponse.json({
        success: true,
        data: riders,
      });
    }

    // Default: return logistics dashboard data
    const currentSeason = getCurrentSeason();
    const weatherMultiplier = getWeatherImpactMultiplier();

    return NextResponse.json({
      success: true,
      data: {
        currentSeason,
        weatherMultiplier,
        totalRiders: 12,
        activeDeliveries: 8,
        pendingPickups: 5,
        shadowZones: NE_STATES_DATA.flatMap(s => s.districts).filter(d => d.connectivityScore <= 3).length,
      },
    });
  } catch (error) {
    console.error('Error in logistics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/logistics - Calculate route or delivery estimate
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { action } = body;

    if (action === 'estimate') {
      const { pickupDistrict, pickupState, deliveryDistrict, deliveryState, weightKg } = body;

      if (!pickupDistrict || !pickupState || !deliveryDistrict || !deliveryState) {
        return NextResponse.json({ error: 'Pickup and delivery locations required' }, { status: 400 });
      }

      // Get district data
      const pickupData = getDistrictData(pickupState, pickupDistrict);
      const deliveryData = getDistrictData(deliveryState, deliveryDistrict);

      if (!pickupData || !deliveryData) {
        return NextResponse.json({ error: 'District not found' }, { status: 404 });
      }

      // Calculate approximate distance (haversine formula would be better with real coordinates)
      const distanceKm = calculateApproxDistance(
        pickupData.coordinates || { lat: 0, lng: 0 },
        deliveryData.coordinates || { lat: 0, lng: 0 }
      );

      // Determine dominant terrain based on both locations
      const terrainTypes: TerrainType[] = [pickupData.terrainType, deliveryData.terrainType];
      const dominantTerrain = getDominantTerrain(terrainTypes);

      // Create route segments
      const segments: RouteSegment[] = [
        {
          from: pickupDistrict,
          to: deliveryDistrict,
          distanceKm,
          terrainType: dominantTerrain,
          averageElevation: (pickupData.averageElevation + deliveryData.averageElevation) / 2,
          maxElevation: Math.max(pickupData.averageElevation, deliveryData.averageElevation),
          connectivityScore: Math.min(pickupData.connectivityScore, deliveryData.connectivityScore),
          hazards: [...(pickupData.hazards.types || []), ...(deliveryData.hazards.types || [])].map((type: string) => ({
            type: type as HazardZone['type'],
            severity: pickupData.hazards.severity,
            seasonal: pickupData.hazards.seasonal,
            months: pickupData.hazards.months,
            description: pickupData.hazards.description,
          })),
          roadCondition: pickupData.connectivityScore >= 7 ? 'GOOD' : pickupData.connectivityScore >= 5 ? 'FAIR' : 'POOR',
        },
      ];

      // Calculate delivery estimate
      const estimate = calculateDeliveryEstimate(segments, weightKg || 1);

      // Check for active hazards
      const currentMonth = new Date().getMonth() + 1;
      const activeHazards = segments[0].hazards.filter(h => 
        !h.seasonal || (h.months && h.months.includes(currentMonth))
      );

      return NextResponse.json({
        success: true,
        data: {
          pickup: {
            district: pickupDistrict,
            state: pickupState,
            terrain: pickupData.terrainType,
            elevation: pickupData.averageElevation,
            connectivity: pickupData.connectivityScore,
          },
          delivery: {
            district: deliveryDistrict,
            state: deliveryState,
            terrain: deliveryData.terrainType,
            elevation: deliveryData.averageElevation,
            connectivity: deliveryData.connectivityScore,
          },
          estimate: {
            distance: estimate.totalDistance,
            timeMinutes: estimate.estimatedTimeMinutes,
            timeFormatted: formatTime(estimate.estimatedTimeMinutes),
            terrainType: estimate.terrainType,
            difficultyScore: estimate.difficultyScore,
            baseCost: estimate.baseCost,
            terrainMultiplier: estimate.terrainMultiplier,
            weatherMultiplier: estimate.weatherMultiplier,
            totalCost: estimate.totalCost,
          },
          hazards: activeHazards,
          recommendations: estimate.recommendations,
          isShadowZone: pickupData.connectivityScore <= 3 || deliveryData.connectivityScore <= 3,
        },
      });
    }

    if (action === 'assign-rider') {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { orderId, riderId } = body;
      
      // In production, this would update the database
      // For demo, return success response
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          riderId,
          assignedAt: new Date().toISOString(),
          estimatedPickup: new Date(Date.now() + 30 * 60000).toISOString(),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in logistics POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Calculate approximate distance between coordinates
function calculateApproxDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Add 30% for hilly terrain winding roads
  return Math.round(R * c * 1.3 * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper: Get dominant terrain from list
function getDominantTerrain(terrains: TerrainType[]): TerrainType {
  const weights: Record<TerrainType, number> = {
    MOUNTAINOUS: 4,
    HILLY: 3,
    VALLEY: 2,
    MIXED: 2,
    PLAIN: 1,
  };
  
  return terrains.reduce((max, t) => weights[t] > weights[max] ? t : max, 'PLAIN');
}

// Helper: Format time for display
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
