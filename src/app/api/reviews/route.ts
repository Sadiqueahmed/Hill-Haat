import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// GET /api/reviews - Get reviews for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: { listingId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.review.count({ where: { listingId } });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      summary: {
        total,
        avgRating,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { listingId, rating, comment } = body;

    // Check if listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if user has ordered this product
    const hasOrdered = await db.order.findFirst({
      where: {
        buyerId: user.id,
        listingId,
        status: 'DELIVERED',
      },
    });

    // Check if already reviewed
    const existingReview = await db.review.findUnique({
      where: {
        listingId_reviewerId: {
          listingId,
          reviewerId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const review = await db.review.create({
      data: {
        listingId,
        reviewerId: user.id,
        rating: parseInt(rating),
        comment,
        isVerified: !!hasOrdered,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update listing rating
    const allReviews = await db.review.findMany({
      where: { listingId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await db.listing.update({
      where: { id: listingId },
      data: { orderCount: allReviews.length },
    });

    // Update seller rating
    const sellerListings = await db.listing.findMany({
      where: { sellerId: listing.sellerId },
      select: { id: true },
    });

    const sellerReviews = await db.review.findMany({
      where: {
        listingId: { in: sellerListings.map((l) => l.id) },
      },
      select: { rating: true },
    });

    const sellerAvgRating = sellerReviews.length > 0
      ? sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length
      : 0;

    await db.user.update({
      where: { id: listing.sellerId },
      data: {
        rating: sellerAvgRating,
        reviewCount: sellerReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
