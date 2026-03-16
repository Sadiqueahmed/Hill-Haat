import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET /api/logistics/[id] - Get partner details with stats
// ============================================
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const partner = await db.logisticsPartner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        riders: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            currentLocation: true,
            currentDistrict: true,
            currentState: true,
            isAvailable: true,
            rating: true,
            totalDeliveries: true,
            isVerified: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Logistics partner not found' }, { status: 404 });
    }

    // Get delivery statistics
    const [
      totalDeliveries,
      completedDeliveries,
      activeDeliveries,
      recentDeliveries,
    ] = await Promise.all([
      // Total deliveries through this partner
      db.delivery.count({
        where: {
          rider: {
            logisticsPartnerId: id,
          },
        },
      }),
      // Completed deliveries
      db.delivery.count({
        where: {
          rider: {
            logisticsPartnerId: id,
          },
          status: 'DELIVERED',
        },
      }),
      // Active deliveries
      db.delivery.count({
        where: {
          rider: {
            logisticsPartnerId: id,
          },
          status: {
            in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION'],
          },
        },
      }),
      // Recent deliveries (last 30 days)
      db.delivery.findMany({
        where: {
          rider: {
            logisticsPartnerId: id,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          order: {
            include: {
              listing: {
                select: {
                  title: true,
                  district: true,
                  state: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate earnings (last 30 days)
    const recentEarnings = recentDeliveries
      .filter(d => d.status === 'DELIVERED')
      .reduce((sum, d) => sum + d.totalEarnings, 0);

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        businessName: partner.businessName,
        description: partner.description,
        phone: partner.phone,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        serviceableDistricts: partner.serviceableDistricts ? JSON.parse(partner.serviceableDistricts) : [],
        serviceableStates: partner.serviceableStates ? JSON.parse(partner.serviceableStates) : [],
        terrainExpertise: partner.terrainExpertise ? JSON.parse(partner.terrainExpertise) : [],
        currentLocation: partner.currentLocation,
        currentDistrict: partner.currentDistrict,
        currentState: partner.currentState,
        currentLatitude: partner.currentLatitude,
        currentLongitude: partner.currentLongitude,
        isAvailable: partner.isAvailable,
        baseRate: partner.baseRate,
        perKmRate: partner.perKmRate,
        terrainMultiplier: partner.terrainMultiplier,
        rating: partner.rating,
        totalDeliveries: partner.totalDeliveries,
        isVerified: partner.isVerified,
        documentsVerified: partner.documentsVerified,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        user: partner.user,
        riders: partner.riders.map(r => ({
          ...r,
          terrainExpertise: r.terrainExpertise ? JSON.parse(r.terrainExpertise) : [],
          serviceableDistricts: r.serviceableDistricts ? JSON.parse(r.serviceableDistricts) : [],
        })),
        stats: {
          totalDeliveries,
          completedDeliveries,
          activeDeliveries,
          completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100).toFixed(1) : '0',
          recentEarnings,
          averageRating: partner.rating.toFixed(1),
        },
        recentDeliveries: recentDeliveries.map(d => ({
          id: d.id,
          status: d.status,
          pickupLocation: d.pickupLocation,
          dropLocation: d.dropLocation,
          estimatedTime: d.estimatedTime,
          totalEarnings: d.totalEarnings,
          createdAt: d.createdAt,
          completedAt: d.completedAt,
          order: d.order ? {
            id: d.order.id,
            orderNumber: d.order.orderNumber,
            listing: d.order.listing,
          } : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching logistics partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/logistics/[id] - Update partner availability, location
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get current user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { logisticsPartner: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check authorization - user must own the partner profile or be admin
    const isOwner = user.logisticsPartner?.id === id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this partner' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Updatable fields
    const allowedFields = [
      'businessName',
      'description',
      'phone',
      'vehicleType',
      'vehicleNumber',
      'baseRate',
      'perKmRate',
      'terrainMultiplier',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle JSON fields
    if (body.serviceableDistricts !== undefined) {
      updateData.serviceableDistricts = JSON.stringify(body.serviceableDistricts);
    }
    if (body.serviceableStates !== undefined) {
      updateData.serviceableStates = JSON.stringify(body.serviceableStates);
    }
    if (body.terrainExpertise !== undefined) {
      updateData.terrainExpertise = JSON.stringify(body.terrainExpertise);
    }

    // Handle availability
    if (body.isAvailable !== undefined) {
      updateData.isAvailable = body.isAvailable;
    }

    // Handle location update
    if (body.location) {
      updateData.currentLocation = body.location.name || body.currentLocation;
      updateData.currentDistrict = body.location.district || body.currentDistrict;
      updateData.currentState = body.location.state || body.currentState;
      if (body.location.latitude !== undefined) {
        updateData.currentLatitude = body.location.latitude;
      }
      if (body.location.longitude !== undefined) {
        updateData.currentLongitude = body.location.longitude;
      }
    }

    // Handle coordinates directly
    if (body.currentLatitude !== undefined) {
      updateData.currentLatitude = body.currentLatitude;
    }
    if (body.currentLongitude !== undefined) {
      updateData.currentLongitude = body.currentLongitude;
    }
    if (body.currentDistrict !== undefined) {
      updateData.currentDistrict = body.currentDistrict;
    }
    if (body.currentState !== undefined) {
      updateData.currentState = body.currentState;
    }
    if (body.currentLocation !== undefined) {
      updateData.currentLocation = body.currentLocation;
    }

    // Admin-only fields
    if (isAdmin) {
      if (body.isVerified !== undefined) {
        updateData.isVerified = body.isVerified;
      }
      if (body.documentsVerified !== undefined) {
        updateData.documentsVerified = body.documentsVerified;
      }
      if (body.rating !== undefined) {
        updateData.rating = body.rating;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedPartner = await db.logisticsPartner.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPartner.id,
        businessName: updatedPartner.businessName,
        isAvailable: updatedPartner.isAvailable,
        currentLocation: updatedPartner.currentLocation,
        currentDistrict: updatedPartner.currentDistrict,
        currentState: updatedPartner.currentState,
        currentLatitude: updatedPartner.currentLatitude,
        currentLongitude: updatedPartner.currentLongitude,
        isVerified: updatedPartner.isVerified,
        rating: updatedPartner.rating,
        updatedAt: updatedPartner.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating logistics partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/logistics/[id] - Delete partner (admin only)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get current user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check for active deliveries
    const activeDeliveries = await db.delivery.count({
      where: {
        rider: {
          logisticsPartnerId: id,
        },
        status: {
          in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION'],
        },
      },
    });

    if (activeDeliveries > 0) {
      return NextResponse.json({
        error: 'Cannot delete partner with active deliveries',
        activeDeliveries,
      }, { status: 400 });
    }

    // Delete partner
    await db.logisticsPartner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Logistics partner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting logistics partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
