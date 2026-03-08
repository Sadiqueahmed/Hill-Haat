import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// Sync user from Clerk to database
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, avatar, role } = body;

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (user) {
      // Update existing user
      user = await db.user.update({
        where: { clerkId: userId },
        data: {
          email: email || user.email,
          name: name || user.name,
          avatar: avatar || user.avatar,
          role: role || user.role,
        },
      });
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: email || '',
          name: name || 'New User',
          avatar: avatar,
          role: role || 'BUYER',
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

// Get current user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        ordersAsBuyer: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            listing: true,
          },
        },
        ordersAsSeller: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            listing: true,
            buyer: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, district, state, address, pincode, businessName, description, role } = body;

    const user = await db.user.update({
      where: { clerkId: userId },
      data: {
        name,
        phone,
        district,
        state,
        address,
        pincode,
        businessName,
        description,
        role,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
