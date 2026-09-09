"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Loader2 } from "lucide-react";

interface AddToCartButtonProps {
  listingId: string;
  stockQuantity: number;
  minOrder: number;
  unit: string;
}

export function AddToCartButton({ listingId, stockQuantity, minOrder, unit }: AddToCartButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [quantity, setQuantity] = useState(minOrder);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error("Add to cart failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (stockQuantity <= 0) {
    return (
      <Button disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex gap-3">
      <Input
        type="number"
        min={minOrder}
        max={stockQuantity}
        step={minOrder}
        value={quantity}
        onChange={(e) => setQuantity(parseFloat(e.target.value) || minOrder)}
        className="w-28"
      />
      <span className="flex items-center text-sm text-muted-foreground">{unit}</span>
      <Button
        onClick={handleAddToCart}
        disabled={loading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        {added ? "Added!" : "Add to Cart"}
      </Button>
    </div>
  );
}