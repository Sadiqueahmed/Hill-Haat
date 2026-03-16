import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { TerrainType, HazardType } from '@/types';
import { calculateDeliveryEstimate } from '@/lib/delivery-calculator';
import { autoAssignRider } from '@/lib/logistics-matcher';
import { getDistrictData } from '@/lib/ne-india-data';
import { getDominantTerrain as getDominantTerrainFromData } from '@/lib/terrain-routing';

// ============================================
// GET /api/orders - Get orders for current user
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer'; // 'buyer' or 'seller'
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (role === 'buyer') {
      where.buyerId = user.id;
    } else if (role === 'seller') {
      where.sellerId = user.id;
    } else if (role === 'rider') {
      // Get orders assigned to rider
      where.riderId = user.id;
    }

    if (status) {
      where.status = status as OrderStatus;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
                rating: true,
                phone: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            rider: {
              select: {
                id: true,
                name: true,
                phone: true,
                rider: {
                  select: {
                    vehicleType: true,
                    vehicleNumber: true,
                  },
                },
              },
            },
          },
        },
        tracking: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await db.order.count({ where });

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/orders - Create a new order with logistics integration
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Get listing to calculate price
    const listing = await db.listing.findUnique({
      where: { id: body.listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    const quantity = parseFloat(body.quantity);
    const totalPrice = listing.price * quantity;

    // ============================================
    // Calculate terrain type and delivery estimate
    // ============================================
    const pickupState = listing.state;
    const pickupDistrict = listing.district;
    const deliveryState = body.deliveryState || user.state;
    const deliveryDistrict = body.deliveryDistrict || user.district;

    let terrainType: TerrainType = 'MIXED';
    let elevationGain = 0;
    let estimatedDeliveryTime: number | undefined;
    let deliveryDifficulty: number | undefined;
    let deliveryCost = 0;

    // Get district data for terrain calculation
    // Note: getDistrictData signature is (name: string, state?: string)
    const pickupData = getDistrictData(pickupDistrict, pickupState);
    const deliveryData = getDistrictData(deliveryDistrict, deliveryState);

    if (pickupData && deliveryData) {
      // Determine dominant terrain
      terrainType = getDominantTerrainFromData([pickupData.terrainType, deliveryData.terrainType]) as TerrainType;
      
      // Calculate elevation gain
      elevationGain = Math.max(0, deliveryData.averageElevation - pickupData.averageElevation);

      // Calculate distance
      let distanceKm = 50; // Default
      if (pickupData.coordinates && deliveryData.coordinates) {
        distanceKm = calculateHaversineDistance(pickupData.coordinates, deliveryData.coordinates);
      }

      // Get delivery estimate
      const estimate = calculateDeliveryEstimate({
        distanceKm,
        terrainType,
        weightKg: quantity,
        pickupElevation: pickupData.averageElevation,
        deliveryElevation: deliveryData.averageElevation,
        pickupConnectivity: pickupData.connectivityScore,
        deliveryConnectivity: deliveryData.connectivityScore,
        hazards: [...(pickupData.hazards.types || []), ...(deliveryData.hazards.types || [])] as HazardType[],
      });

      estimatedDeliveryTime = estimate.time.totalTimeMinutes;
      deliveryDifficulty = Math.round(estimate.cost.terrainMultiplier * 3);
      deliveryCost = estimate.cost.totalCost;
    }

    // ============================================
    // Create order with delivery information
    // ============================================
    const order = await db.order.create({
      data: {
        buyerId: user.id,
        sellerId: listing.sellerId,
        listingId: body.listingId,
        quantity,
        unitPrice: listing.price,
        totalPrice,
        paymentMethod: body.paymentMethod,
        deliveryAddress: body.deliveryAddress || user.address || '',
        deliveryDistrict,
        deliveryState,
        deliveryPincode: body.deliveryPincode || user.pincode || '',
        deliveryPhone: body.deliveryPhone || user.phone || '',
        notes: body.notes,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        // NE India terrain-aware delivery fields
        terrainType,
        elevationGain,
        estimatedDeliveryTime,
        deliveryDifficulty,
      },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================
    // Create initial tracking event
    // ============================================
    await db.trackingEvent.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        description: 'Order placed successfully',
      },
    });

    // ============================================
    // Create notification for seller
    // ============================================
    await db.notification.create({
      data: {
        userId: listing.sellerId,
        type: 'ORDER_PLACED',
        title: 'New Order Received',
        message: `You have a new order for ${listing.title}`,
        data: JSON.stringify({ orderId: order.id }),
      },
    });

    // ============================================
    // Update listing order count
    // ============================================
    await db.listing.update({
      where: { id: body.listingId },
      data: { orderCount: { increment: 1 } },
    });

    // ============================================
    // Find and assign rider automatically
    // ============================================
    let riderAssigned = false;
    let assignedRiderId: string | undefined;
    let assignedRiderName: string | undefined;

    if (pickupData && deliveryData) {
      try {
        const matchResult = await autoAssignRider(order.id);
        
        if (matchResult.success) {
          riderAssigned = true;
          assignedRiderId = matchResult.riderId;
          assignedRiderName = matchResult.riderName;
        }
      } catch (error) {
        console.error('Auto-assign failed, order created without rider:', error);
      }
    }

    // ============================================
    // Return response with delivery info
    // ============================================
    return NextResponse.json({
      success: true,
      data: {
        ...order,
        delivery: {
          terrainType,
          elevationGain,
          estimatedDeliveryTime,
          deliveryDifficulty,
          deliveryCost,
        },
        riderAssignment: {
          success: riderAssigned,
          riderId: assignedRiderId,
          riderName: assignedRiderName,
        },
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateHaversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
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
