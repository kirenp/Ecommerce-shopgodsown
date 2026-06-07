'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useUI } from "@/lib/uiContext";
import { getProductDetails } from "@/app/actions";
import { usePreview } from "@/lib/preview";

interface ProductCardProps {
  handle: string;
  image: string;
  title: string;
  price: string;
  currencyCode?: string;
  isSale?: boolean;
}

export default function ProductCard({ handle, image, title, price, currencyCode = "INR", isSale }: ProductCardProps) {
  const { openQuickView } = useUI();
  const [loading, setLoading] = useState(false);
  const { getPreviewPath } = usePreview();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Don't navigate to product page

    if (loading) return;

    setLoading(true);
    try {
      const fullProduct = await getProductDetails(handle);
      if (fullProduct) {
        openQuickView(fullProduct);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={getPreviewPath(`/products/${handle}`)} className="group cursor-pointer block">
      {/* Dark tinted card */}
      <div className="relative bg-black/85 border border-black/10 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {isSale && (
            <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <span className="text-[9px] text-white uppercase tracking-widest">Sale</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-white text-sm font-medium tracking-wider uppercase truncate group-hover:text-white transition-colors">
              {title}
            </h3>
            <p className="text-white/60 text-xs font-light mt-1 tracking-widest">
              ₹{parseFloat(price).toLocaleString("en-IN")} {currencyCode}
            </p>
          </div>

          {/* ADD TO CART button on card */}
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.25em] rounded-xl hover:bg-white hover:text-black transition-all duration-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </>
            ) : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
