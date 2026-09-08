import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';


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

    // A user may only self-upgrade from BUYER -> FARMER or BUYER -> LOGISTICS
    // during onboarding. They can never set ADMIN, and can never change role
    // once it's no longer BUYER (prevents role oscillation/abuse).
    const existingUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedSelfUpgrade = role === 'FARMER' || role === 'LOGISTICS';
    const canChangeRole = existingUser.role === 'BUYER' && allowedSelfUpgrade;
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
        ...(canChangeRole ? { role } : {}),
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
