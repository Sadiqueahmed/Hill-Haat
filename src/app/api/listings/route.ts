import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { ListingStatus } from '@prisma/client';

import { fetchListings } from '@/lib/listings-query';
import { Category } from '@prisma/client';

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await fetchListings({
      category: (searchParams.get('category') as Category) || undefined,
      state: searchParams.get('state') || undefined,
      district: searchParams.get('district') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      isOrganic: searchParams.get('isOrganic') === 'true',
      isVerified: searchParams.get('isVerified') === 'true',
      sellerId: searchParams.get('sellerId') || undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'price' | 'viewCount') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json({
      success: true,
      data: result.listings,
      pagination: result.pagination,
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
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        stockQuantity: body.stockQuantity ? parseFloat(body.stockQuantity) : 0,
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : null,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        images: Array.isArray(body.images) ? body.images : [],
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
