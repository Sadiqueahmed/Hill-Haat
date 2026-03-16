import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    
    // Get platform-wide stats
    const [
      totalProducts,
      totalFarmers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      db.listing.count({ where: { status: 'ACTIVE' } }),
      db.user.count({ where: { role: 'FARMER' } }),
      db.order.count(),
      db.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalPrice: true },
      }),
    ]);

    // If user is signed in, get their personal stats
    let userStats = null;
    let notificationCount = 0;
    let cartCount = 0;

    if (userId) {
      const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
          _count: {
            select: {
              listings: true,
              ordersAsBuyer: true,
              ordersAsSeller: true,
              cartItems: true,
            },
          },
        },
      });

      if (user) {
        // Get notification count
        notificationCount = await db.notification.count({
          where: { userId: user.id, isRead: false },
        });

        // Get cart items count
        const cartItems = await db.cartItem.findMany({
          where: { userId: user.id },
          select: { quantity: true },
        });
        cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        // Get user revenue if farmer
        const sellerRevenue = await db.order.aggregate({
          where: { sellerId: user.id, paymentStatus: 'PAID' },
          _sum: { totalPrice: true },
        });

        // Get user spending if buyer
        const buyerSpending = await db.order.aggregate({
          where: { buyerId: user.id, paymentStatus: 'PAID' },
          _sum: { totalPrice: true },
        });

        userStats = {
          totalListings: user._count.listings,
          totalOrders: user._count.ordersAsBuyer + user._count.ordersAsSeller,
          buyerOrders: user._count.ordersAsBuyer,
          sellerOrders: user._count.ordersAsSeller,
          totalRevenue: sellerRevenue._sum.totalPrice || 0,
          totalSpending: buyerSpending._sum.totalPrice || 0,
          rating: user.rating,
          reviewCount: user.reviewCount,
        };
      }
    }

    return NextResponse.json({
      platform: {
        totalProducts,
        totalFarmers,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      },
      user: userStats,
      notificationCount,
      cartCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
