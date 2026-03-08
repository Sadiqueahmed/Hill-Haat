import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// GET /api/orders - Get orders for current user
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
              },
            },
          },
        },
        tracking: {
          orderBy: {
            timestamp: 'desc',
          },
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

// POST /api/orders - Create a new order
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

    const totalPrice = listing.price * parseFloat(body.quantity);

    const order = await db.order.create({
      data: {
        buyerId: user.id,
        sellerId: listing.sellerId,
        listingId: body.listingId,
        quantity: parseFloat(body.quantity),
        unitPrice: listing.price,
        totalPrice,
        paymentMethod: body.paymentMethod,
        deliveryAddress: body.deliveryAddress || user.address || '',
        deliveryDistrict: body.deliveryDistrict || user.district || '',
        deliveryState: body.deliveryState || user.state || '',
        deliveryPincode: body.deliveryPincode || user.pincode || '',
        deliveryPhone: body.deliveryPhone || user.phone || '',
        notes: body.notes,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
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

    // Create initial tracking event
    await db.trackingEvent.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        description: 'Order placed successfully',
      },
    });

    // Create notification for seller
    await db.notification.create({
      data: {
        userId: listing.sellerId,
        type: 'ORDER_PLACED',
        title: 'New Order Received',
        message: `You have a new order for ${listing.title}`,
        data: JSON.stringify({ orderId: order.id }),
      },
    });

    // Update listing order count
    await db.listing.update({
      where: { id: body.listingId },
      data: { orderCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
