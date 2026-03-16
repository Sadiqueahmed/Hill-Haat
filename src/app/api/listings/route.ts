import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { ListingStatus } from '@prisma/client';
import { getDistrictData } from '@/lib/ne-india-data';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a district from NE India data
 */
function getDistrictCoordinates(district: string, state: string): { lat: number; lng: number } | null {
  const districtData = getDistrictData(district);
  if (districtData?.coordinates) {
    return districtData.coordinates;
  }
  return null;
}

/**
 * Get elevation for a district
 */
function getDistrictElevation(district: string): number | null {
  const districtData = getDistrictData(district);
  if (districtData) {
    return districtData.averageElevation;
  }
  return null;
}

/**
 * Get nearest highway for a district
 */
function getNearestHighway(district: string, state: string): string | null {
  const districtData = getDistrictData(district);
  if (districtData) {
    // Get state info for major highways
    const stateData = getStateHighways(state);
    return stateData;
  }
  return null;
}

/**
 * Get major highways for a state
 */
function getStateHighways(state: string): string | null {
  const highways: Record<string, string> = {
    'Arunachal Pradesh': 'NH-13, NH-15, Trans-Arunachal Highway',
    'Assam': 'NH-15, NH-17, NH-27, NH-37',
    'Manipur': 'NH-2, NH-37, NH-102',
    'Meghalaya': 'NH-6, NH-106, NH-217',
    'Mizoram': 'NH-54, NH-6, NH-102A',
    'Nagaland': 'NH-29, NH-36, NH-702',
    'Sikkim': 'NH-10, NH-310, NH-510',
    'Tripura': 'NH-8, NH-108, NH-208',
  };
  return highways[state] || null;
}

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
    let sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Location-based parameters
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const deliveryRadius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null;
    const nearMe = searchParams.get('nearMe') === 'true';

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

    // If sorting by distance, we need to fetch all results and sort in memory
    const fetchLimit = (userLat && userLng && (sortBy === 'distance' || nearMe || deliveryRadius)) 
      ? 200 // Fetch more for distance filtering/sorting
      : limit;

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
      orderBy: sortBy === 'distance' ? undefined : {
        [sortBy]: sortOrder,
      },
      take: fetchLimit,
      skip: sortBy === 'distance' ? 0 : offset,
    });

    // Calculate distance and additional location data for each listing
    let listingsWithLocationData = listings.map((listing) => {
      // Get listing coordinates from stored data or district data
      let listingLat = listing.latitude;
      let listingLng = listing.longitude;
      
      // If listing doesn't have coordinates, try to get from district
      if (!listingLat || !listingLng) {
        const districtCoords = getDistrictCoordinates(listing.district, listing.state);
        if (districtCoords) {
          listingLat = districtCoords.lat;
          listingLng = districtCoords.lng;
        }
      }
      
      // Calculate distance from user
      let distance: number | null = null;
      if (userLat && userLng && listingLat && listingLng) {
        distance = calculateDistance(userLat, userLng, listingLat, listingLng);
      }
      
      // Get elevation data
      const elevation = listing.elevation || getDistrictElevation(listing.district);
      
      // Get nearest highway
      const nearestHighway = listing.nearestHighway || getNearestHighway(listing.district, listing.state);
      
      // Get nearest market from district data
      const districtData = getDistrictData(listing.district);
      const nearestMarket = listing.nearestMarket || districtData?.majorMarkets?.[0] || null;
      
      // Get terrain type
      const terrainType = listing.terrainType || districtData?.terrainType || null;
      
      // Connectivity score
      const connectivityScore = listing.connectivityScore || districtData?.connectivityScore || null;
      
      // Calculate average rating
      const avgRating = listing.reviews.length > 0
        ? listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length
        : 0;

      return {
        ...listing,
        avgRating,
        reviewCount: listing.reviews.length,
        distance,
        latitude: listingLat,
        longitude: listingLng,
        elevation,
        nearestHighway,
        nearestMarket,
        terrainType,
        connectivityScore,
      };
    });

    // Filter by delivery radius if specified
    if (deliveryRadius && userLat && userLng) {
      listingsWithLocationData = listingsWithLocationData.filter(
        listing => listing.distance !== null && listing.distance <= deliveryRadius
      );
    }

    // Sort by distance if requested
    if (sortBy === 'distance' && userLat && userLng) {
      listingsWithLocationData.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
      
      // Apply pagination after sorting
      listingsWithLocationData = listingsWithLocationData.slice(offset, offset + limit);
    } else if (deliveryRadius || nearMe) {
      // Apply pagination for radius-filtered results
      listingsWithLocationData = listingsWithLocationData.slice(offset, offset + limit);
    }

    // Get total count
    let total: number;
    if (deliveryRadius && userLat && userLng) {
      // For radius-filtered queries, count the filtered results
      const allListings = await db.listing.findMany({
        where,
        select: { id: true, district: true, state: true, latitude: true, longitude: true },
      });
      
      total = allListings.filter(listing => {
        let lat = listing.latitude;
        let lng = listing.longitude;
        
        if (!lat || !lng) {
          const coords = getDistrictCoordinates(listing.district, listing.state);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }
        
        if (lat && lng) {
          const dist = calculateDistance(userLat, userLng, lat, lng);
          return dist <= deliveryRadius;
        }
        return false;
      }).length;
    } else {
      total = await db.listing.count({ where });
    }

    return NextResponse.json({
      success: true,
      data: listingsWithLocationData,
      userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null,
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
    
    // Get district data for auto-filling location info
    const districtData = getDistrictData(body.district);
    
    // Prepare listing data with location info
    const listingData: Record<string, unknown> = {
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
    };
    
    // Auto-fill location data from district if not provided
    if (body.latitude) {
      listingData.latitude = parseFloat(body.latitude);
    } else if (districtData?.coordinates) {
      listingData.latitude = districtData.coordinates.lat;
    }
    
    if (body.longitude) {
      listingData.longitude = parseFloat(body.longitude);
    } else if (districtData?.coordinates) {
      listingData.longitude = districtData.coordinates.lng;
    }
    
    if (body.elevation) {
      listingData.elevation = parseFloat(body.elevation);
    } else if (districtData?.averageElevation) {
      listingData.elevation = districtData.averageElevation;
    }
    
    if (districtData?.terrainType) {
      listingData.terrainType = districtData.terrainType;
    }
    
    if (districtData?.connectivityScore) {
      listingData.connectivityScore = districtData.connectivityScore;
    }
    
    if (body.nearestHighway) {
      listingData.nearestHighway = body.nearestHighway;
    } else {
      listingData.nearestHighway = getStateHighways(body.state);
    }
    
    if (body.nearestMarket) {
      listingData.nearestMarket = body.nearestMarket;
    } else if (districtData?.majorMarkets?.length) {
      listingData.nearestMarket = districtData.majorMarkets[0];
    }

    const listing = await db.listing.create({
      data: listingData as Parameters<typeof db.listing.create>[0]['data'],
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
