import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { 
  TerrainType, 
  HazardType, 
  getTerrainForDistrict, 
  estimateDistance,
  estimateElevation,
  isShadowZone,
  getCommonHazards,
} from '@/lib/delivery-calculator';
import { calculateDeliveryCost } from '@/lib/delivery-calculator';

// GET /api/delivery-routes - Get routes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupState = searchParams.get('pickupState');
    const pickupDistrict = searchParams.get('pickupDistrict');
    const dropState = searchParams.get('dropState');
    const dropDistrict = searchParams.get('dropDistrict');
    const terrainType = searchParams.get('terrainType') as TerrainType | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter
    const where: Record<string, unknown> = { isActive: true };
    
    if (pickupState) where.pickupState = pickupState;
    if (pickupDistrict) where.pickupDistrict = pickupDistrict;
    if (dropState) where.dropState = dropState;
    if (dropDistrict) where.dropDistrict = dropDistrict;
    if (terrainType) where.terrainType = terrainType;

    const routes = await db.deliveryRoute.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error) {
    console.error('Error fetching delivery routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery routes' },
      { status: 500 }
    );
  }
}

// POST /api/delivery-routes - Calculate new route
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    const body = await request.json();
    const {
      pickupDistrict,
      pickupState,
      dropDistrict,
      dropState,
      vehicleType = 'SMALL_TRUCK',
      weight = 10,
      isUrgent = false,
      season = 'DRY',
    } = body;

    // Validate required fields
    if (!pickupDistrict || !pickupState || !dropDistrict || !dropState) {
      return NextResponse.json(
        { error: 'Pickup and drop locations are required' },
        { status: 400 }
      );
    }

    // Calculate route characteristics
    const distance = estimateDistance(pickupDistrict, pickupState, dropDistrict, dropState);
    const terrainType = getTerrainForDistrict(dropDistrict, dropState);
    const pickupElevation = estimateElevation(pickupDistrict, pickupState);
    const dropElevation = estimateElevation(dropDistrict, dropState);
    const maxElevation = Math.max(pickupElevation, dropElevation) + Math.round(distance * 5); // Add terrain gain
    const shadowZone = isShadowZone(pickupDistrict, pickupState) || isShadowZone(dropDistrict, dropState);
    const hazardZones = getCommonHazards(pickupDistrict, pickupState, dropDistrict, dropState, season);

    // Calculate delivery cost
    const calculation = calculateDeliveryCost(
      {
        pickupDistrict,
        pickupState,
        pickupElevation,
        dropDistrict,
        dropState,
        dropElevation,
        distance,
        terrainType,
        maxElevation,
        hazardZones,
        isShadowZone: shadowZone,
      },
      {
        vehicleType,
        weight,
        isUrgent,
        season,
      }
    );

    // Generate route name
    const routeName = `${pickupDistrict} → ${dropDistrict}`;

    // Check if route already exists
    let route = await db.deliveryRoute.findFirst({
      where: {
        pickupDistrict,
        pickupState,
        dropDistrict,
        dropState,
      },
    });

    if (!route) {
      // Create new route
      route = await db.deliveryRoute.create({
        data: {
          name: routeName,
          pickupLocation: pickupDistrict,
          pickupDistrict,
          pickupState,
          dropLocation: dropDistrict,
          dropDistrict,
          dropState,
          terrainType,
          distance,
          estimatedTime: calculation.estimatedTime,
          baseCost: calculation.totalCost,
          elevationGain: Math.abs(maxElevation - pickupElevation),
          maxElevation,
          connectivityScore: shadowZone ? 3 : 7,
          hazardZones: JSON.stringify(hazardZones),
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        route,
        calculation,
        routeInfo: {
          distance,
          terrainType,
          maxElevation,
          elevationGain: Math.abs(maxElevation - pickupElevation),
          isShadowZone: shadowZone,
          hazardZones,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating delivery route:', error);
    return NextResponse.json(
      { error: 'Failed to calculate delivery route' },
      { status: 500 }
    );
  }
}
