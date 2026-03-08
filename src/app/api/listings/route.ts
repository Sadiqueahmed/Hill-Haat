import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { ListingStatus } from '@prisma/client';

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isOrganic = searchParams.get('isOrganic');
    const isVerified = searchParams.get('isVerified');
    const sellerId = searchParams.get('sellerId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      status: ListingStatus.ACTIVE,
    };

    if (category) {
      where.category = category;
    }

    if (state) {
      where.state = state;
    }

    if (district) {
      where.district = district;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        (where.price as Record<string, number>).gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        (where.price as Record<string, number>).lte = parseFloat(maxPrice);
      }
    }

    if (isOrganic === 'true') {
      where.isOrganic = true;
    }

    if (isVerified === 'true') {
      where.isVerified = true;
    }

    const listings = await db.listing.findMany({
      where,
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
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: offset,
    });

    // Calculate average rating for each listing
    const listingsWithRating = listings.map((listing) => ({
      ...listing,
      avgRating: listing.reviews.length > 0
        ? listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length
        : 0,
      reviewCount: listing.reviews.length,
    }));

    const total = await db.listing.count({ where });

    return NextResponse.json({
      success: true,
      data: listingsWithRating,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing
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

    const listing = await db.listing.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        price: parseFloat(body.price),
        unit: body.unit || 'kg',
        minOrder: parseFloat(body.minOrder) || 1,
        maxQuantity: body.maxQuantity ? parseFloat(body.maxQuantity) : null,
        quality: body.quality || 'A',
        isOrganic: body.isOrganic || false,
        organicCertHash: body.organicCertHash,
        district: body.district,
        state: body.state,
        coordinates: body.coordinates,
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : null,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        images: body.images ? JSON.stringify(body.images) : null,
        sellerId: user.id,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            rating: true,
            district: true,
            state: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
