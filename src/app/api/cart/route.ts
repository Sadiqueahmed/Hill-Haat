import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth, clerkClient } from '@clerk/nextjs/server';

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

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            unit: true,
            images: true,
            category: true,
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
                rating: true,
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate totals
    const subtotal = cartItems.reduce(
      (acc, item) => acc + item.listing.price * item.quantity,
      0
    );

    return NextResponse.json({
      success: true,
      data: cartItems,
      summary: {
        itemCount: cartItems.length,
        subtotal,
        deliveryFee: subtotal > 500 ? 0 : 50,
        total: subtotal + (subtotal > 500 ? 0 : 50),
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }

    const body = await request.json();
    const { listingId, quantity } = body;

    // Check if listing exists and is active
    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing not available' },
        { status: 404 }
      );
    }

    // Check if already in cart
    const existingItem = await db.cartItem.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
        include: { listing: true },
      });

      return NextResponse.json({
        success: true,
        data: updatedItem,
        message: 'Cart updated',
      });
    }

    // Add new item
    const cartItem = await db.cartItem.create({
      data: {
        userId: user.id,
        listingId,
        quantity: quantity || 1,
      },
      include: { listing: true },
    });

    return NextResponse.json({
      success: true,
      data: cartItem,
      message: 'Added to cart',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// PATCH /api/cart - Update cart item quantity
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }

    const body = await request.json();
    const { listingId, quantity } = body;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await db.cartItem.deleteMany({
        where: {
          userId: user.id,
          listingId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    const cartItem = await db.cartItem.update({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId,
        },
      },
      data: { quantity },
      include: { listing: true },
    });

    return NextResponse.json({
      success: true,
      data: cartItem,
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart or remove item
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (listingId) {
      // Remove specific item
      await db.cartItem.deleteMany({
        where: {
          userId: user.id,
          listingId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    // Clear entire cart
    await db.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
