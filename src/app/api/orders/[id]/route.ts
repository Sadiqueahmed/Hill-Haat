import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
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
            avatar: true,
            phone: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
        delivery: {
          include: {
            rider: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        tracking: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is authorized (buyer, seller, or admin)
    if (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization
    const isSeller = existingOrder.sellerId === user.id;
    const isBuyer = existingOrder.buyerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    const trackingEvents: Array<{ status: string; description: string; location?: string }> = [];

    if (body.status) {
      updateData.status = body.status as OrderStatus;

      // Add tracking event based on status
      const statusDescriptions: Record<string, string> = {
        CONFIRMED: 'Order confirmed by seller',
        PROCESSING: 'Order is being prepared',
        SHIPPED: 'Order has been shipped',
        IN_TRANSIT: 'Order is in transit',
        OUT_FOR_DELIVERY: 'Out for delivery',
        DELIVERED: 'Order delivered successfully',
        CANCELLED: body.cancellationReason || 'Order cancelled',
        RETURNED: 'Order returned',
      };

      if (statusDescriptions[body.status]) {
        trackingEvents.push({
          status: body.status,
          description: statusDescriptions[body.status],
          location: body.location,
        });
      }

      // Update timestamps
      if (body.status === 'CONFIRMED') {
        updateData.confirmedAt = new Date();
      } else if (body.status === 'SHIPPED') {
        updateData.shippedAt = new Date();
      } else if (body.status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (body.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.cancellationReason;
      }
    }

    if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus as PaymentStatus;
    }

    // Update order
    const order = await db.order.update({
      where: { id },
      data: updateData,
    });

    // Create tracking events
    for (const event of trackingEvents) {
      await db.trackingEvent.create({
        data: {
          orderId: id,
          status: event.status,
          description: event.description,
          location: event.location,
        },
      });
    }

    // Create notification
    const notificationUserId = isSeller ? existingOrder.buyerId : existingOrder.sellerId;
    await db.notification.create({
      data: {
        userId: notificationUserId,
        type: body.status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_CONFIRMED',
        title: `Order ${body.status?.toLowerCase() || 'updated'}`,
        message: `Order #${existingOrder.orderNumber} has been ${body.status?.toLowerCase() || 'updated'}`,
        data: JSON.stringify({ orderId: id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
