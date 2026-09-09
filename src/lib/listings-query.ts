import { db } from "@/lib/db";
import { Category, ListingStatus } from "@prisma/client";

export interface ListingsFilter {
  category?: Category;
  state?: string;
  district?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  isVerified?: boolean;
  sellerId?: string;
  sortBy?: "createdAt" | "price" | "viewCount";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// Plain, JSON-safe shape returned to Server/Client Components.
// Prisma's Decimal type cannot cross the RSC serialization boundary,
// so every Decimal field is converted to a number here, once, centrally.
export interface SerializedListing {
  id: string;
  title: string;
  description: string;
  category: Category;
  subcategory: string | null;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity: number | null;
  stockQuantity: number;
  quality: string;
  isOrganic: boolean;
  isVerified: boolean;
  district: string;
  state: string;
  images: string[];
  harvestDate: Date | null;
  createdAt: Date;
  avgRating: number;
  reviewCount: number;
  seller: {
    id: string;
    name: string;
    avatar: string | null;
    isVerified: boolean;
    rating: number;
    role: string;
    district: string | null;
    state: string | null;
  };
}

function buildWhere(filter: ListingsFilter) {
  const where: Record<string, unknown> = { status: ListingStatus.ACTIVE };

  if (filter.category) where.category = filter.category;
  if (filter.state) where.state = filter.state;
  if (filter.district) where.district = filter.district;
  if (filter.sellerId) where.sellerId = filter.sellerId;
  if (filter.isOrganic) where.isOrganic = true;
  if (filter.isVerified) where.isVerified = true;

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.price = {};
    if (filter.minPrice !== undefined) (where.price as Record<string, number>).gte = filter.minPrice;
    if (filter.maxPrice !== undefined) (where.price as Record<string, number>).lte = filter.maxPrice;
  }

  return where;
}

function serializeListing(listing: any): SerializedListing {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    subcategory: listing.subcategory,
    price: Number(listing.price),
    unit: listing.unit,
    minOrder: Number(listing.minOrder),
    maxQuantity: listing.maxQuantity !== null ? Number(listing.maxQuantity) : null,
    stockQuantity: Number(listing.stockQuantity),
    quality: listing.quality,
    isOrganic: listing.isOrganic,
    isVerified: listing.isVerified,
    district: listing.district,
    state: listing.state,
    images: listing.images ?? [],
    harvestDate: listing.harvestDate,
    createdAt: listing.createdAt,
    avgRating:
      listing.reviews.length > 0
        ? listing.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / listing.reviews.length
        : 0,
    reviewCount: listing.reviews.length,
    seller: {
      id: listing.seller.id,
      name: listing.seller.name,
      avatar: listing.seller.avatar,
      isVerified: listing.seller.isVerified,
      rating: Number(listing.seller.rating),
      role: listing.seller.role,
      district: listing.seller.district,
      state: listing.seller.state,
    },
  };
}

const sellerSelect = {
  id: true,
  name: true,
  avatar: true,
  isVerified: true,
  rating: true,
  role: true,
  district: true,
  state: true,
} as const;

export async function fetchListings(filter: ListingsFilter = {}) {
  const where = buildWhere(filter);
  const sortBy = filter.sortBy ?? "createdAt";
  const sortOrder = filter.sortOrder ?? "desc";
  const limit = filter.limit ?? 20;
  const offset = filter.offset ?? 0;

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      include: {
        seller: { select: sellerSelect },
        reviews: { select: { rating: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    }),
    db.listing.count({ where }),
  ]);

  return {
    listings: listings.map(serializeListing),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

export async function fetchListingById(id: string): Promise<SerializedListing | null> {
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: { select: sellerSelect },
      reviews: { select: { rating: true } },
    },
  });

  if (!listing) return null;
  return serializeListing(listing);
}