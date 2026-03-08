import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Helper to get or create user
async function getOrCreateUser(userId: string) {
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    // Try to get user info from Clerk and create the user
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          avatar: clerkUser.imageUrl,
          role: 'BUYER',
        },
      });
    } catch (error) {
      console.error('Failed to create user from Clerk:', error);
      return null;
    }
  }

  return user;
}

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
      const user = await getOrCreateUser(userId);

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

        // Get counts separately
        const [listingsCount, ordersAsBuyerCount, ordersAsSellerCount] = await Promise.all([
          db.listing.count({ where: { sellerId: user.id } }),
          db.order.count({ where: { buyerId: user.id } }),
          db.order.count({ where: { sellerId: user.id } }),
        ]);

        userStats = {
          totalListings: listingsCount,
          totalOrders: ordersAsBuyerCount + ordersAsSellerCount,
          buyerOrders: ordersAsBuyerCount,
          sellerOrders: ordersAsSellerCount,
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
