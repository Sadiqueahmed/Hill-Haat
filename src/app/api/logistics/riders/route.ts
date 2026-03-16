import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { VehicleType, TerrainType } from '@/types';

// ============================================
// GET /api/logistics/riders - List available riders
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const district = searchParams.get('district');
    const state = searchParams.get('state');
    const vehicleType = searchParams.get('vehicleType');
    const terrainExpertise = searchParams.get('terrainExpertise');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const logisticsPartnerId = searchParams.get('logisticsPartnerId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'rating'; // rating, deliveries, distance
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (availableOnly) {
      where.isAvailable = true;
    }

    if (verifiedOnly) {
      where.isVerified = true;
    }

    if (district) {
      where.currentDistrict = district;
    }

    if (state) {
      where.currentState = state;
    }

    if (logisticsPartnerId) {
      where.logisticsPartnerId = logisticsPartnerId;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get riders
    const riders = await db.rider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        logisticsPartner: {
          select: {
            id: true,
            businessName: true,
            rating: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: sortBy === 'rating' ? { rating: sortOrder } :
               sortBy === 'deliveries' ? { totalDeliveries: sortOrder } :
               { createdAt: sortOrder },
    });

    // Filter by terrain expertise (in-memory since it's JSON)
    let filteredRiders = riders;
    if (terrainExpertise) {
      filteredRiders = riders.filter(r => {
        const expertise = r.terrainExpertise ? JSON.parse(r.terrainExpertise) : [];
        return expertise.includes(terrainExpertise);
      });
    }

    // Get total count for pagination
    const total = await db.rider.count({ where });

    return NextResponse.json({
      success: true,
      data: filteredRiders.map(r => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        phone: r.phone,
        avatar: r.avatar,
        vehicleType: r.vehicleType,
        vehicleNumber: r.vehicleNumber,
        currentLocation: r.currentLocation,
        currentDistrict: r.currentDistrict,
        currentState: r.currentState,
        currentLatitude: r.currentLatitude,
        currentLongitude: r.currentLongitude,
        serviceableDistricts: r.serviceableDistricts ? JSON.parse(r.serviceableDistricts) : [],
        terrainExpertise: r.terrainExpertise ? JSON.parse(r.terrainExpertise) : [],
        isAvailable: r.isAvailable,
        rating: r.rating,
        totalDeliveries: r.totalDeliveries,
        isVerified: r.isVerified,
        aadhaarVerified: r.aadhaarVerified,
        drivingLicenseVerified: r.drivingLicenseVerified,
        logisticsPartnerId: r.logisticsPartnerId,
        logisticsPartner: r.logisticsPartner,
        user: r.user,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/logistics/riders - Create new rider
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get current user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      name,
      phone,
      vehicleType,
      vehicleNumber,
      logisticsPartnerId,
      serviceableDistricts,
      terrainExpertise,
      currentLocation,
      currentDistrict,
      currentState,
      currentLatitude,
      currentLongitude,
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ 
        error: 'Name and phone are required' 
      }, { status: 400 });
    }

    // Check if user already has a rider profile
    const existingRider = await db.rider.findUnique({
      where: { userId: user.id },
    });

    if (existingRider) {
      return NextResponse.json({ 
        error: 'User already has a rider profile' 
      }, { status: 400 });
    }

    // If logisticsPartnerId provided, verify it exists and belongs to user or user is admin
    if (logisticsPartnerId) {
      const partner = await db.logisticsPartner.findUnique({
        where: { id: logisticsPartnerId },
      });

      if (!partner) {
        return NextResponse.json({ 
          error: 'Logistics partner not found' 
        }, { status: 404 });
      }

      // Only partner owner or admin can add riders to a partner
      if (partner.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ 
          error: 'Not authorized to add rider to this partner' 
        }, { status: 403 });
      }
    }

    // Create rider
    const rider = await db.rider.create({
      data: {
        userId: user.id,
        name,
        phone,
        vehicleType: vehicleType || 'BIKE',
        vehicleNumber,
        logisticsPartnerId: logisticsPartnerId || null,
        serviceableDistricts: serviceableDistricts ? JSON.stringify(serviceableDistricts) : null,
        terrainExpertise: terrainExpertise ? JSON.stringify(terrainExpertise) : null,
        currentLocation,
        currentDistrict,
        currentState,
        currentLatitude,
        currentLongitude,
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        logisticsPartner: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Update user role to LOGISTICS if not already
    if (user.role !== 'LOGISTICS' && user.role !== 'ADMIN') {
      await db.user.update({
        where: { id: user.id },
        data: { role: 'LOGISTICS' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        logisticsPartnerId: rider.logisticsPartnerId,
        logisticsPartner: rider.logisticsPartner,
        serviceableDistricts: rider.serviceableDistricts ? JSON.parse(rider.serviceableDistricts) : [],
        terrainExpertise: rider.terrainExpertise ? JSON.parse(rider.terrainExpertise) : [],
        currentLocation: rider.currentLocation,
        currentDistrict: rider.currentDistrict,
        currentState: rider.currentState,
        isAvailable: rider.isAvailable,
        createdAt: rider.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating rider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/logistics/riders - Update rider location/availability
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get current user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find rider profile for this user
    const rider = await db.rider.findUnique({
      where: { userId: user.id },
    });

    if (!rider) {
      return NextResponse.json({ 
        error: 'Rider profile not found' 
      }, { status: 404 });
    }

    const {
      isAvailable,
      currentLocation,
      currentDistrict,
      currentState,
      currentLatitude,
      currentLongitude,
      serviceableDistricts,
      terrainExpertise,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (typeof isAvailable === 'boolean') {
      updateData.isAvailable = isAvailable;
    }

    if (currentLocation !== undefined) {
      updateData.currentLocation = currentLocation;
    }

    if (currentDistrict !== undefined) {
      updateData.currentDistrict = currentDistrict;
    }

    if (currentState !== undefined) {
      updateData.currentState = currentState;
    }

    if (typeof currentLatitude === 'number') {
      updateData.currentLatitude = currentLatitude;
    }

    if (typeof currentLongitude === 'number') {
      updateData.currentLongitude = currentLongitude;
    }

    if (serviceableDistricts !== undefined) {
      updateData.serviceableDistricts = JSON.stringify(serviceableDistricts);
    }

    if (terrainExpertise !== undefined) {
      updateData.terrainExpertise = JSON.stringify(terrainExpertise);
    }

    // Update rider
    const updatedRider = await db.rider.update({
      where: { id: rider.id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        logisticsPartner: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRider.id,
        name: updatedRider.name,
        phone: updatedRider.phone,
        vehicleType: updatedRider.vehicleType,
        vehicleNumber: updatedRider.vehicleNumber,
        logisticsPartnerId: updatedRider.logisticsPartnerId,
        logisticsPartner: updatedRider.logisticsPartner,
        serviceableDistricts: updatedRider.serviceableDistricts ? JSON.parse(updatedRider.serviceableDistricts) : [],
        terrainExpertise: updatedRider.terrainExpertise ? JSON.parse(updatedRider.terrainExpertise) : [],
        currentLocation: updatedRider.currentLocation,
        currentDistrict: updatedRider.currentDistrict,
        currentState: updatedRider.currentState,
        currentLatitude: updatedRider.currentLatitude,
        currentLongitude: updatedRider.currentLongitude,
        isAvailable: updatedRider.isAvailable,
        updatedAt: updatedRider.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating rider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
