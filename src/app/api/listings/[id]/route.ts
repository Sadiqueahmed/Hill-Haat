import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// GET /api/listings/[id] - Get a single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            rating: true,
            role: true,
            district: true,
            state: true,
            phone: true,
            totalSales: true,
            reviewCount: true,
            createdAt: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Increment view count
    await db.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Calculate average rating
    const avgRating = listing.reviews.length > 0
      ? listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        avgRating,
      },
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PATCH /api/listings/[id] - Update a listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user owns the listing
    const existingListing = await db.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const listing = await db.listing.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        price: body.price ? parseFloat(body.price) : undefined,
        unit: body.unit,
        minOrder: body.minOrder ? parseFloat(body.minOrder) : undefined,
        maxQuantity: body.maxQuantity ? parseFloat(body.maxQuantity) : null,
        quality: body.quality,
        isOrganic: body.isOrganic,
        district: body.district,
        state: body.state,
        coordinates: body.coordinates,
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : undefined,
        images: body.images ? JSON.stringify(body.images) : undefined,
        status: body.status,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            rating: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] - Delete a listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user owns the listing
    const existingListing = await db.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.listing.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
