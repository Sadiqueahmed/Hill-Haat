import { notFound } from "next/navigation";
import { fetchListingById } from "@/lib/listings-query";
import { CATEGORY_LABELS, QUALITY_LABELS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Leaf, Shield, Clock } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = await fetchListingById(id);
  if (!listing) return { title: "Listing not found | Hill-Haat" };

  return {
    title: `${listing.title} | Hill-Haat`,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = await fetchListingById(id);

  if (!listing) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <span className="text-9xl opacity-30">🌾</span>
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{CATEGORY_LABELS[listing.category]}</Badge>
            {listing.isOrganic && (
              <Badge className="bg-emerald-500 text-white gap-1">
                <Leaf className="h-3 w-3" /> Organic
              </Badge>
            )}
            {listing.isVerified && (
              <Badge className="bg-emerald-600 text-white gap-1">
                <Shield className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-3">{listing.title}</h1>

          <div className="flex items-center gap-1 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span>{listing.district}, {listing.state}</span>
          </div>

          <p className="text-muted-foreground mb-6">{listing.description}</p>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold text-emerald-600">₹{listing.price}</span>
            <span className="text-muted-foreground">/{listing.unit}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-muted-foreground">Minimum order:</span>{" "}
              <span className="font-medium">{listing.minOrder} {listing.unit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">In stock:</span>{" "}
              <span className="font-medium">{listing.stockQuantity} {listing.unit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Quality grade:</span>{" "}
              <span className="font-medium">{QUALITY_LABELS[listing.quality as keyof typeof QUALITY_LABELS]}</span>
            </div>
            {listing.harvestDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{new Date(listing.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium">
              {listing.seller.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{listing.seller.name}</div>
              <div className="text-sm text-muted-foreground">{listing.seller.district}, {listing.seller.state}</div>
            </div>
            {listing.seller.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-current" />
                <span className="font-medium">{listing.seller.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <AddToCartButton listingId={listing.id} stockQuantity={listing.stockQuantity} minOrder={listing.minOrder} unit={listing.unit} />
        </div>
      </div>
    </div>
  );
}