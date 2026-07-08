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
  variant?: "dark" | "glass";
}

export default function ProductCard({ 
  handle, 
  image, 
  title, 
  price, 
  currencyCode = "INR", 
  isSale,
  variant = "dark"
}: ProductCardProps) {
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

  if (variant === "glass") {
    return (
      <Link href={getPreviewPath(`/products/${handle}`)} className="group cursor-pointer block">
        {/* Apple Liquid Glass Card */}
        <div className="relative aspect-[2/3] w-full bg-white/20 border border-white/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          
          {/* Full Image Background */}
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] [transform:translateZ(0)]">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Apple Liquid Glass Highlight reflection (diagonal glare line) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-10" />
            
            {isSale && (
              <div className="absolute top-4 left-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 z-20">
                <span className="text-[9px] text-zinc-800 uppercase tracking-widest font-semibold">Sale</span>
              </div>
            )}
          </div>

          {/* Info & Glass Panel overlaying the image at the bottom */}
          <div className="absolute inset-x-0 bottom-0 p-6 space-y-4 bg-white/30 backdrop-blur-md border-t border-white/40 z-20">
            <div>
              <h3 className="text-zinc-800 text-base font-semibold tracking-wider uppercase truncate">
                {title}
              </h3>
              {/* Subtle divider line under title */}
              <div className="w-8 h-[1.5px] bg-zinc-400/50 mt-2" />
              <p className="text-zinc-700 text-sm font-medium mt-3 tracking-widest">
                ₹{parseFloat(price).toLocaleString("en-IN")} {currencyCode}
              </p>
            </div>

            {/* ADD TO CART button on glass card */}
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="w-full py-3.5 bg-zinc-200/50 hover:bg-zinc-100/80 backdrop-blur-sm border border-zinc-300/30 text-zinc-800 text-[10px] font-bold uppercase tracking-[0.25em] rounded-2xl transition-all duration-400 flex items-center justify-between px-6 shadow-sm group-hover:shadow-md"
            >
              {loading ? (
                <span className="w-full text-center">Processing...</span>
              ) : (
                <>
                  <span>Add to Cart</span>
                  <span className="text-base font-light leading-none">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Default Dark Card
  return (
    <Link href={getPreviewPath(`/products/${handle}`)} className="group cursor-pointer block">
      {/* Dark tinted card */}
      <div className="relative bg-black/85 border border-black/10 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl [transform:translateZ(0)]">
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
