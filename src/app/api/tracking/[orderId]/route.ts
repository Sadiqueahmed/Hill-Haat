import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// GET /api/tracking/[orderId] - Get order tracking information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { userId } = await auth();

    // Get order with tracking details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          select: {
            title: true,
            images: true,
            seller: {
              select: {
                id: true,
                name: true,
                phone: true,
                district: true,
                state: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            rider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        tracking: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        deliveryRoute: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this order
    if (userId) {
      const user = await db.user.findUnique({
        where: { clerkId: userId },
      });
      
      if (user && user.id !== order.buyerId && user.id !== order.sellerId) {
        // Check if user is the rider
        const isRider = order.delivery?.riderId === user.id;
        if (!isRider && user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    }

    // Calculate progress percentage
    const statusProgress: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 15,
      PROCESSING: 25,
      SHIPPED: 40,
      IN_TRANSIT: 60,
      OUT_FOR_DELIVERY: 85,
      DELIVERED: 100,
      CANCELLED: 0,
      RETURNED: 0,
    };

    const progress = statusProgress[order.status] || 0;

    // Format tracking timeline
    const timeline = order.tracking.map((event, index) => ({
      id: event.id,
      status: event.status,
      location: event.location,
      description: event.description,
      timestamp: event.timestamp,
      isLatest: index === 0,
    }));

    // Build response
    const trackingData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      progress,
      
      // Product info
      product: {
        title: order.listing.title,
        image: order.listing.images ? JSON.parse(order.listing.images)[0] : null,
        seller: order.listing.seller,
      },
      
      // Delivery info
      delivery: order.delivery ? {
        id: order.delivery.id,
        status: order.delivery.status,
        pickupLocation: order.delivery.pickupLocation,
        dropLocation: order.delivery.dropLocation,
        estimatedDistance: order.delivery.estimatedDistance,
        estimatedTime: order.delivery.estimatedTime,
        currentLocation: order.delivery.currentLocation,
        lastLocationUpdate: order.delivery.lastLocationUpdate,
        terrainType: order.delivery.terrainType,
        difficultyLevel: order.delivery.difficultyLevel,
        rider: order.delivery.rider ? {
          id: order.delivery.rider.id,
          name: order.delivery.rider.name,
          phone: order.delivery.rider.phone,
          avatar: order.delivery.rider.user.avatar,
          vehicleType: order.delivery.rider.vehicleType,
          rating: order.delivery.rider.rating,
        } : null,
      } : null,
      
      // Route info
      route: order.deliveryRoute ? {
        terrainType: order.deliveryRoute.terrainType,
        distance: order.deliveryRoute.distance,
        estimatedTime: order.deliveryRoute.estimatedTime,
        elevationGain: order.deliveryRoute.elevationGain,
        connectivityScore: order.deliveryRoute.connectivityScore,
        hazardZones: order.deliveryRoute.hazardZones 
          ? JSON.parse(order.deliveryRoute.hazardZones)
          : [],
      } : null,
      
      // Timeline
      timeline,
      
      // Addresses
      pickup: {
        district: order.listing.seller.district,
        state: order.listing.seller.state,
      },
      drop: {
        address: order.deliveryAddress,
        district: order.deliveryDistrict,
        state: order.deliveryState,
        pincode: order.deliveryPincode,
      },
      
      // Timestamps
      timestamps: {
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        estimatedDelivery: order.estimatedDeliveryTime 
          ? new Date(Date.now() + order.estimatedDeliveryTime * 60000).toISOString()
          : null,
      },
    };

    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}

// POST /api/tracking/[orderId] - Update rider location (rider only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
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

    // Get order and verify rider
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.riderId !== user.id) {
      return NextResponse.json(
        { error: 'Only assigned rider can update location' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      latitude, 
      longitude, 
      locationName,
      status,
      notes,
    } = body;

    // Update delivery location
    if (order.delivery) {
      await db.delivery.update({
        where: { id: order.delivery.id },
        data: {
          currentLocation: locationName || `${latitude},${longitude}`,
          lastLocationUpdate: new Date(),
          ...(status && { status }),
        },
      });
    }

    // Create tracking event if status provided
    if (status) {
      await db.trackingEvent.create({
        data: {
          orderId,
          status,
          location: locationName,
          description: notes || `Rider location updated: ${locationName || 'In transit'}`,
        },
      });

      // Update order status if necessary
      const statusMap: Record<string, string> = {
        PICKED_UP: 'SHIPPED',
        IN_TRANSIT: 'IN_TRANSIT',
        NEAR_DESTINATION: 'OUT_FOR_DELIVERY',
        DELIVERED: 'DELIVERED',
      };

      if (statusMap[status]) {
        await db.order.update({
          where: { id: orderId },
          data: {
            status: statusMap[status],
            ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
