import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { VehicleType, TerrainType } from '@/types';

// GET /api/logistics - Get logistics partners with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const vehicleType = searchParams.get('vehicleType') as VehicleType | null;
    const terrainType = searchParams.get('terrainType') as TerrainType | null;
    const available = searchParams.get('available');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter
    const where: Record<string, unknown> = {};
    
    if (available === 'true') {
      where.isAvailable = true;
    }
    
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get logistics partners
    const partners = await db.logisticsPartner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            rating: true,
          },
        },
        riders: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            vehicleType: true,
            rating: true,
            currentDistrict: true,
          },
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    // Filter by service area if specified
    let filteredPartners = partners;
    if (state || district) {
      filteredPartners = partners.filter(partner => {
        const serviceableStates = partner.serviceableStates 
          ? JSON.parse(partner.serviceableStates) as string[]
          : [];
        const serviceableDistricts = partner.serviceableDistricts
          ? JSON.parse(partner.serviceableDistricts) as string[]
          : [];
        
        if (state && !serviceableStates.includes(state)) return false;
        if (district && !serviceableDistricts.includes(district)) return false;
        return true;
      });
    }

    // Filter by terrain expertise if specified
    if (terrainType) {
      filteredPartners = filteredPartners.filter(partner => {
        const terrainExpertise = partner.terrainExpertise
          ? JSON.parse(partner.terrainExpertise) as TerrainType[]
          : [];
        return terrainExpertise.includes(terrainType);
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredPartners,
      count: filteredPartners.length,
    });
  } catch (error) {
    console.error('Error fetching logistics partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logistics partners' },
      { status: 500 }
    );
  }
}

// POST /api/logistics - Create new logistics partner
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has LOGISTICS role
    if (user.role !== 'LOGISTICS' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'User must have LOGISTICS role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      businessName,
      description,
      phone,
      vehicleType,
      vehicleNumber,
      serviceableDistricts,
      serviceableStates,
      terrainExpertise,
      baseRate,
      perKmRate,
      terrainMultiplier,
    } = body;

    // Check if partner already exists
    const existingPartner = await db.logisticsPartner.findUnique({
      where: { userId: user.id },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Logistics partner profile already exists' },
        { status: 400 }
      );
    }

    // Create logistics partner
    const partner = await db.logisticsPartner.create({
      data: {
        userId: user.id,
        businessName,
        description,
        phone,
        vehicleType: vehicleType || 'SMALL_TRUCK',
        vehicleNumber,
        serviceableDistricts: serviceableDistricts ? JSON.stringify(serviceableDistricts) : null,
        serviceableStates: serviceableStates ? JSON.stringify(serviceableStates) : null,
        terrainExpertise: terrainExpertise ? JSON.stringify(terrainExpertise) : null,
        baseRate: baseRate || 30,
        perKmRate: perKmRate || 8,
        terrainMultiplier: terrainMultiplier || 1.0,
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Logistics partner profile created successfully',
    });
  } catch (error) {
    console.error('Error creating logistics partner:', error);
    return NextResponse.json(
      { error: 'Failed to create logistics partner' },
      { status: 500 }
    );
  }
}
