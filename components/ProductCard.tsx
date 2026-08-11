'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
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
  const [wishlisted, setWishlisted] = useState(false);
  const { getPreviewPath } = usePreview();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(prev => !prev);
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
            {/* Apple Liquid Glass Highlight reflection removed as requested */}
            {isSale && (
              <div className="absolute top-4 left-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 z-20">
                <span className="text-[9px] text-zinc-800 uppercase tracking-widest font-semibold">Sale</span>
              </div>
            )}
          </div>

          {/* Info & Apple Liquid Glass Panel overlaying the image at the bottom */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-5 md:p-6 space-y-4 bg-gradient-to-b from-black/40 via-black/60 to-black/80 backdrop-blur-xl border-t border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] rounded-b-[2.5rem] overflow-hidden">
            {/* Specular sheen reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-white text-sm md:text-base font-bold tracking-wider uppercase truncate drop-shadow-sm">
                {title}
              </h3>
              {/* Subtle liquid glass divider line under title */}
              <div className="w-8 h-[1.5px] bg-gradient-to-r from-white/60 to-white/10 mt-2" />
              <p className="text-white font-black text-sm md:text-base mt-2.5 tracking-widest drop-shadow">
                ₹{parseFloat(price).toLocaleString("en-IN")} {currencyCode}
              </p>
            </div>

            {/* ADD TO CART button on liquid glass card */}
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="relative z-10 w-full py-3 md:py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-[0.25em] rounded-2xl transition-all duration-400 flex items-center justify-between px-5 md:px-6 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.4)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] group-hover:border-white/50"
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

  // Default Dark Card with Apple Liquid Glass content section
  return (
    <Link href={getPreviewPath(`/products/${handle}`)} className="group cursor-pointer block">
      {/* Liquid glass card container */}
      <div className="relative bg-[#0a0a0a] border border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-white/[0.25] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl [transform:translateZ(0)]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {isSale && (
            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <span className="text-[9px] text-white uppercase tracking-widest font-bold">Sale</span>
            </div>
          )}

          {/* Wishlist Heart Icon */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
          >
            <Heart
              size={14}
              className={`transition-colors duration-300 ${wishlisted ? "fill-red-500 text-red-500" : "text-white/80"}`}
            />
          </button>
        </div>

        {/* Info - Apple Liquid Glass Content Section */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-white/12 via-white/6 to-black/50 backdrop-blur-xl border-t border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] relative overflow-hidden rounded-b-2xl">
          {/* Glass reflection sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h3 className="text-white text-sm font-bold tracking-[0.05em] uppercase truncate group-hover:text-white transition-colors drop-shadow-sm">
              {title}
            </h3>
            <div className="w-8 h-[1.5px] bg-gradient-to-r from-white/50 to-white/10 mt-2" />
            <p className="text-white font-black text-xs md:text-sm mt-2.5 tracking-widest drop-shadow">
              ₹{parseFloat(price).toLocaleString("en-IN")} {currencyCode}
            </p>
          </div>

          {/* ADD TO CART liquid glass button */}
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="relative z-10 w-full py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-400 flex items-center justify-between px-4 shadow-[0_4px_14px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.4)] group-hover:border-white/40"
          >
            {loading ? (
              <span className="w-full text-center">Processing...</span>
            ) : (
              <>
                <span>Add to Cart</span>
                <span className="text-xs font-light leading-none">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
