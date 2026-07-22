'use client';

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";
import { useRecentlyViewed } from "@/lib/recentlyViewedContext";
import { useWishlist } from "@/lib/wishlistContext";
import { usePreview } from "@/lib/preview";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface ProductDetailProps {
  product: any;
}

const SIZE_ORDER: Record<string, number> = {
  "XXS": 1,
  "XS": 2,
  "S": 3,
  "M": 4,
  "L": 5,
  "XL": 6,
  "XXL": 7,
  "2XL": 7,
  "XXXL": 8,
  "3XL": 8,
  "4XL": 9
};

function sortSizesList(sizes: any[]) {
  if (!sizes) return [];
  const getLabel = (s: any) => {
    if (!s) return "";
    if (typeof s === 'string') return s;
    return s.label || s.value || s.name || "";
  };

  return [...sizes].sort((a, b) => {
    const aLabel = getLabel(a).toUpperCase();
    const bLabel = getLabel(b).toUpperCase();
    const aVal = SIZE_ORDER[aLabel] ?? 99;
    const bVal = SIZE_ORDER[bLabel] ?? 99;
    if (aVal !== bVal) return aVal - bVal;
    return aLabel.localeCompare(bLabel);
  });
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { items, addToCart } = useCart();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const { getPreviewPath } = usePreview();
  const router = useRouter();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState(product.images[0]?.url || "/images/placeholder.png");
  const [cartFeedback, setCartFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Register product into Recently Viewed Context on mount
  useEffect(() => {
    if (product && product.handle) {
      addRecentlyViewed({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.images[0]?.url || displayImage,
        price: product.price,
        currencyCode: product.currencyCode || "INR",
        category: product.category || "",
      });
    }
  }, [product.id, product.handle]);

  const availableColors = product.colors || [];

  // Update image when color changes
  useEffect(() => {
    if (selectedColor) {
      const variantWithImage = product.variants.find((v: any) =>
        v.image && v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor)
      );
      if (variantWithImage?.image) setDisplayImage(variantWithImage.image);
    }
  }, [selectedColor, product.variants]);

  // Sizes available for selected color
  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return sortSizesList(product.sizes || []);
    const sizes = product.variants
      .filter((v: any) => v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor))
      .map((v: any) => {
        const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === "size");
        return sizeOpt ? sizeOpt.value : null;
      })
      .filter(Boolean);
    return sortSizesList(Array.from(new Set(sizes)).map((s) => ({ label: s })));
  }, [selectedColor, product.variants, product.sizes]);

  const currentVariant = useMemo(() => {
    return product.variants.find((v: any) => {
      const colorMatch = !selectedColor || v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor);
      const sizeMatch = !selectedSize || v.options.some((opt: any) => opt.name.toLowerCase() === "size" && opt.value === selectedSize);
      return colorMatch && sizeMatch;
    });
  }, [product.variants, selectedColor, selectedSize]);

  const isVariantSelected = selectedColor !== null && selectedSize !== null;
  const isAvailable = currentVariant ? currentVariant.available : product.available;
  const availableStock = currentVariant?.quantityAvailable ?? 999;
  const inCartItem = items.find(i => i.variantId === currentVariant?.id);
  const inCartQty = inCartItem ? inCartItem.quantity : 0;
  const isMaxStockReached = isVariantSelected && inCartQty >= availableStock;

  const handleAddToCart = () => {
    if (!isVariantSelected || !isAvailable) return;
    addToCart({
      id: product.id,
      variantId: currentVariant?.id || product.id,
      handle: product.handle,
      title: product.title,
      image: displayImage,
      color: selectedColor || "",
      size: selectedSize || "",
      price: currentVariant?.price || product.price,
      currencyCode: product.currencyCode || "INR",
      quantityAvailable: currentVariant?.quantityAvailable
    });
    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isVariantSelected || !isAvailable) return;
    addToCart({
      id: product.id,
      variantId: currentVariant?.id || product.id,
      handle: product.handle,
      title: product.title,
      image: displayImage,
      color: selectedColor || "",
      size: selectedSize || "",
      price: currentVariant?.price || product.price,
      currencyCode: product.currencyCode || "INR",
      quantityAvailable: currentVariant?.quantityAvailable
    });
    // Navigate to checkout using Next.js client-side push
    router.push(getPreviewPath("/checkout"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
          {(() => {
            const activeMedia = product.images.find((m: any) => m.url === displayImage) || { type: 'IMAGE', url: displayImage };
            if (activeMedia.type === 'VIDEO') {
              return (
                <video key={activeMedia.url} src={activeMedia.url} autoPlay muted loop playsInline className="w-full h-full object-cover transition-all duration-700" />
              );
            }
            return (
              <Image src={activeMedia.url} alt={product.title} fill className="object-cover transition-all duration-700" priority />
            );
          })()}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {product.images.map((img: any, i: number) => (
            <div
              key={i}
              onClick={() => setDisplayImage(img.url)}
              className={`relative aspect-square overflow-hidden rounded-xl cursor-pointer border transition-all duration-300 ${displayImage === img.url ? "border-white/60 ring-1 ring-white/20" : "border-white/5 opacity-50 hover:opacity-100"}`}
            >
              {img.type === 'VIDEO' ? (
                <video src={img.url} autoPlay muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <Image src={img.url} alt={`${product.title} ${i}`} fill className="object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-white/30 text-[10px] tracking-[0.4em] uppercase mb-4">
            <span>{product.category || "New Arrival"}</span>
            <div className="w-8 h-[1px] bg-white/20" />
          </div>
          <h1 className="font-brand text-5xl md:text-7xl font-light text-white tracking-tight uppercase leading-none mb-5">
            {product.title}
          </h1>
          <p className="text-xl font-light text-white tracking-widest">
            ₹{parseFloat(currentVariant?.price || product.price).toLocaleString("en-IN")} {product.currencyCode || "INR"}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3 border-t border-white/5 pt-8">
          <h3 className="text-[10px] text-white uppercase tracking-[0.3em]">About This Piece</h3>
          <p className="text-white leading-relaxed font-light">
            {product.description || "A luxury piece designed to disrupt. Precision-tailored for the modern presence."}
          </p>
        </div>

        {/* Colors + Sizes */}
        <div className="space-y-8">
          {availableColors.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] text-white uppercase tracking-[0.3em]">
                Color
                {selectedColor && <span className="text-white ml-3 font-medium tracking-widest">— {selectedColor}</span>}
              </h4>
              <div className="flex flex-wrap gap-4">
                {availableColors.map((c: any, i: number) => (
                  <div key={i} className="group relative" onClick={() => { setSelectedColor(c.label); setSelectedSize(null); }}>
                    <div
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${selectedColor === c.label ? "border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.2)]" : "border-white/40 hover:scale-110 hover:border-white/80"}`}
                      style={{ backgroundColor: c.color.toLowerCase() }}
                      title={c.label}
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-white/0 group-hover:text-white uppercase tracking-widest whitespace-nowrap transition-all duration-300">
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sizes — only shown when color is selected (or always if no colors) */}
          {(availableSizesForColor.length > 0 || (availableColors.length === 0 && (product.sizes?.length > 0))) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] text-white uppercase tracking-[0.3em]">
                  Size
                  {selectedSize && <span className="text-white ml-3 font-medium tracking-widest">— {selectedSize}</span>}
                </h4>
                <button onClick={() => setShowSizeGuide(true)} className="text-[10px] text-white hover:text-white uppercase tracking-wider underline underline-offset-4 font-medium transition-colors">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {sortSizesList(availableSizesForColor.length > 0 ? availableSizesForColor : product.sizes || []).map((s: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(s.label)}
                    className={`w-14 h-14 border text-[11px] font-medium uppercase tracking-wider rounded-xl transition-all duration-300 ${selectedSize === s.label ? "bg-white text-black border-white" : "border-white/40 text-white hover:border-white/80"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selection guard hint */}
        {!isVariantSelected && availableColors.length > 0 && (
          <p className="text-luxury-kasavu text-[11px] tracking-[0.15em] font-semibold uppercase animate-pulse">
            {!selectedColor ? "← Select a color to continue" : "← Now select a size"}
          </p>
        )}

        {/* Stock Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full ${!isAvailable || availableStock <= 0 ? "bg-red-400" : "bg-green-400"}`} />
          <span className="text-[10px] text-white uppercase tracking-widest font-medium">
            {!isAvailable || availableStock <= 0
              ? "Out of Stock"
              : "In Stock — Ready to ship"}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* ADD TO CART — glass, secondary */}
            <button
              onClick={handleAddToCart}
              disabled={!isVariantSelected || !isAvailable || isMaxStockReached}
              className={`flex-1 py-4 bg-white/8 backdrop-blur-md border text-xs font-bold uppercase tracking-[0.3em] rounded-xl transition-all duration-500 ${!isVariantSelected || !isAvailable || isMaxStockReached
                ? "border-white/5 text-white/20 cursor-not-allowed"
                : cartFeedback
                  ? "border-green-400/50 text-green-300 bg-green-400/10"
                  : "border-white/15 text-white hover:bg-white/15 hover:border-white/30"
                }`}
            >
              {cartFeedback ? "✓ Added to Cart" : isMaxStockReached ? "Max Stock in Cart" : "Add to Cart"}
            </button>

            {/* WISHLIST HEART TOGGLE */}
            <button
              onClick={() => {
                toggleWishlist({
                  id: currentVariant?.id || product.id,
                  title: product.title,
                  handle: product.handle,
                  image: displayImage,
                  price: currentVariant?.price || product.price,
                  color: selectedColor || "",
                  size: selectedSize || "",
                  currencyCode: product.currencyCode || "INR"
                });
              }}
              className={`px-4 py-4 rounded-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
                isInWishlist(product.id) || isInWishlist(currentVariant?.id || "")
                  ? "bg-[#C81E1E]/20 border-[#C81E1E] text-[#C81E1E]"
                  : "bg-white/8 border-white/15 text-white/60 hover:text-white hover:border-white/30"
              }`}
              title="Add to Wishlist"
            >
              <Heart size={18} className={isInWishlist(product.id) || isInWishlist(currentVariant?.id || "") ? "fill-[#C81E1E]" : ""} />
            </button>
          </div>

          {isMaxStockReached && (
            <p className="text-[11px] text-amber-400/90 font-medium tracking-wide text-center pt-1">
              You have added the maximum available quantity for this variant.
            </p>
          )}

          {/* BUY NOW — Apple Liquid Glass + Running Red Light */}
          <div className="relative group mt-2">
            {/* Running red light on border — conic gradient rotates endlessly */}
            <div
              className={`absolute -inset-[1.5px] rounded-xl transition-opacity duration-500 ${!isVariantSelected || !isAvailable ? 'opacity-0' : 'opacity-100'}`}
              style={{
                background: 'conic-gradient(from var(--angle, 0deg), transparent 60%, #ef4444 75%, #ff6b6b 80%, transparent 90%)',
                animation: 'spin-border 2.4s linear infinite',
                borderRadius: '0.75rem',
              }}
            />

            {/* Glass button body */}
            <button
              onClick={handleBuyNow}
              disabled={!isVariantSelected || !isAvailable}
              className={`relative w-full py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-500 overflow-hidden
                backdrop-blur-2xl
                ${!isVariantSelected || !isAvailable
                  ? 'bg-white/4 border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/8 border border-white/15 text-white cursor-pointer hover:bg-white/12 hover:border-white/25'
                }`}
              style={isVariantSelected && isAvailable ? {
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
              } : {}}
            >
              {/* Glass inner highlight streak */}
              {isVariantSelected && isAvailable && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
                  }}
                />
              )}

              {/* Red ambient glow beneath text */}
              {isVariantSelected && isAvailable && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl opacity-30"
                  style={{ background: 'rgba(239,68,68,0.6)' }} />
              )}

              <div className="flex items-center justify-center gap-4 w-full relative z-10">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-white drop-shadow-sm">Buy Now</span>
                <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${!isVariantSelected || !isAvailable ? 'text-white/20' : 'text-white'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {/* Payment Options */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/BUUYNOWBUYYON.png"
                alt="UPI · VISA · Mastercard · American Express"
                style={{ width: '180px', height: 'auto' }}
                className={`relative z-10 transition-opacity duration-300 ${!isVariantSelected || !isAvailable ? 'opacity-20' : 'opacity-65'}`}
              />
            </button>
          </div>

          {/* Keyframe for spinning border light */}
          <style dangerouslySetInnerHTML={{ __html: `
            @property --angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
            @keyframes spin-border {
              to { --angle: 360deg; }
            }
          ` }} />
        </div>

        {/* Shipping Info */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <h4 className="text-[10px] text-white font-medium uppercase tracking-widest">Heritage Shipping</h4>
            <p className="text-[10px] text-white uppercase tracking-widest leading-loose">Kerala to Worldwide<br />5–7 Business Days</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] text-white font-medium uppercase tracking-widest">Luxury Packaging</h4>
            <p className="text-[10px] text-white uppercase tracking-widest leading-loose">Eco-Friendly<br />Premium Branding</p>
          </div>
        </div>
      </div>

      {/* Size Guide Modal Overlay */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)}></div>
          <div className="relative bg-white text-black p-8 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-brand font-semibold mb-6">Size Guide</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-center">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                    <th className="p-4 font-bold text-gray-700">Size</th>
                    <th className="p-4 font-bold text-gray-700">Chest (in)</th>
                    <th className="p-4 font-bold text-gray-700">Chest (cm)</th>
                    <th className="p-4 font-bold text-gray-700">Length (in)</th>
                    <th className="p-4 font-bold text-gray-700">Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">S</td>
                    <td className="p-4 text-gray-600">21</td>
                    <td className="p-4 text-gray-600">53.34</td>
                    <td className="p-4 text-gray-600">29</td>
                    <td className="p-4 text-gray-600">73.66</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">M</td>
                    <td className="p-4 text-gray-600">22</td>
                    <td className="p-4 text-gray-600">55.88</td>
                    <td className="p-4 text-gray-600">29.5</td>
                    <td className="p-4 text-gray-600">74.93</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">L</td>
                    <td className="p-4 text-gray-600">23</td>
                    <td className="p-4 text-gray-600">58.42</td>
                    <td className="p-4 text-gray-600">30</td>
                    <td className="p-4 text-gray-600">76.20</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">XL</td>
                    <td className="p-4 text-gray-600">24</td>
                    <td className="p-4 text-gray-600">60.96</td>
                    <td className="p-4 text-gray-600">30.5</td>
                    <td className="p-4 text-gray-600">77.47</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold">XXL</td>
                    <td className="p-4 text-gray-600">25</td>
                    <td className="p-4 text-gray-600">63.50</td>
                    <td className="p-4 text-gray-600">31</td>
                    <td className="p-4 text-gray-600">78.74</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center">Measurements may vary up to 1 inch due to manual calculation.</p>
          </div>
        </div>
      )}
    </div>
  );
}
