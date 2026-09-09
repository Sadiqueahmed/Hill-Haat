import { fetchListings } from "@/lib/listings-query";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MarketplaceFilters } from "./marketplace-filters";
import { Category } from "@prisma/client";

export const metadata = {
  title: "Marketplace | Hill-Haat",
  description: "Browse fresh produce, spices, tea, and handicrafts directly from farmers across Northeast India's hill regions.",
};

interface MarketplacePageProps {
  searchParams: Promise<{
    category?: string;
    state?: string;
    district?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    isOrganic?: string;
    sortBy?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const { listings, pagination } = await fetchListings({
    category: (params.category as Category) || undefined,
    state: params.state || undefined,
    district: params.district || undefined,
    search: params.search || undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    isOrganic: params.isOrganic === "true",
    sortBy: (params.sortBy as "createdAt" | "price" | "viewCount") || "createdAt",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">
          {pagination.total} product{pagination.total !== 1 ? "s" : ""} from farmers across the Northeast hills
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <MarketplaceFilters currentFilters={params} />
        </aside>

        <div className="lg:col-span-3">
          {listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No products match your filters yet. Try broadening your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing, index) => (
                <ProductCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          )}

          {pagination.hasMore && (
            <div className="mt-8 text-center">
              
                href={`/marketplace?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="inline-block px-6 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Load more
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}