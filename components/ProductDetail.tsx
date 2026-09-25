'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";
import { useRecentlyViewed } from "@/lib/recentlyViewedContext";
import { useWishlist } from "@/lib/wishlistContext";
import { usePreview } from "@/lib/preview";
import { useRouter } from "next/navigation";
import { Heart, Search, ArrowDown, X, Plus, Minus, Truck, ShieldCheck } from "lucide-react";
import { trackViewContent } from "@/lib/metaPixel";

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

function renderProductTitle(title: string) {
  if (!title) return null;
  const match = title.match(/^(.*?)[\s]+((?:OVERSIZED\s+)?(?:T-SHIRT|T-Shirt|TANK TOP|Tank Top|HOODIE|Hoodie|SWEATSHIRT|Sweatshirt))$/i);
  if (match) {
    return (
      <>
        <span className="block">{match[1]}</span>
        <span className="block whitespace-nowrap mt-1">{match[2]}</span>
      </>
    );
  }
  return title;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { items, addToCart } = useCart();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const { getPreviewPath } = usePreview();
  const router = useRouter();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [displayImage, setDisplayImage] = useState(product.images[0]?.url || "/images/placeholder.png");
  const [cartFeedback, setCartFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Close zoom modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomOpen(false);
      }
    };
    if (isZoomOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  const handleNextImage = () => {
    if (!product.images || product.images.length === 0) return;
    const currentIndex = product.images.findIndex((img: any) => img.url === displayImage);
    const nextIndex = (currentIndex + 1) % product.images.length;
    const nextImg = product.images[nextIndex];
    if (nextImg) {
      setDisplayImage(nextImg.url);
      if (thumbnailsRef.current) {
        const children = thumbnailsRef.current.children;
        if (children[nextIndex]) {
          (children[nextIndex] as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }
    }
  };

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

      // Track ViewContent for Meta Pixel
      trackViewContent({
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currencyCode || "INR",
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
  const isAvailable = currentVariant ? Boolean(currentVariant.available) : Boolean(product.available);
  const availableStock = currentVariant?.quantityAvailable ?? 999;
  const isOutOfStock = isVariantSelected && (!currentVariant || !isAvailable || availableStock <= 0);
  const inCartItem = items.find(i => i.variantId === currentVariant?.id);
  const inCartQty = inCartItem ? inCartItem.quantity : 0;
  const isMaxStockReached = isVariantSelected && !isOutOfStock && availableStock > 0 && inCartQty >= availableStock;

  // Auto-clamp selected quantity if stock changes or size is selected
  useEffect(() => {
    const maxVal = Math.max(1, Math.min(10, availableStock));
    if (selectedQty > maxVal) {
      setSelectedQty(maxVal);
    }
  }, [selectedSize, selectedColor, availableStock]);

  const handleAddToCart = () => {
    if (!isVariantSelected || isOutOfStock) return;
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
      quantityAvailable: currentVariant?.quantityAvailable,
      quantity: selectedQty
    });
    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isVariantSelected || isOutOfStock) return;
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
      quantityAvailable: currentVariant?.quantityAvailable,
      quantity: selectedQty
    });
    router.push(getPreviewPath("/checkout"));
  };

  // Track the natural aspect ratio of the active image so the container adapts
  const [imageAspect, setImageAspect] = useState<number>(1);

  useEffect(() => {
    if (!displayImage) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = displayImage;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageAspect(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [displayImage]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      {/* Image Gallery — Redesigned according to reference */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
        {/* Left Thumbnails Column */}
        {product.images && product.images.length > 1 && (
          <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-20 md:w-24 shrink-0">
            {/* Scrollable thumbnail list */}
            <div 
              ref={thumbnailsRef}
              className="flex sm:flex-col gap-2.5 w-full overflow-x-auto sm:overflow-y-auto max-h-[620px] md:max-h-[750px] lg:max-h-[820px] no-scrollbar py-0.5 px-0.5 scroll-smooth"
            >
              {product.images.map((img: any, i: number) => {
                const isActive = displayImage === img.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDisplayImage(img.url)}
                    style={{ aspectRatio: imageAspect > 0 ? imageAspect : 0.67 }}
                    className={`relative w-16 sm:w-full shrink-0 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "border-2 border-white ring-2 ring-white/40 scale-[1.02] shadow-md opacity-100" 
                        : "border border-white/10 opacity-60 hover:opacity-100 hover:border-white/40"
                    }`}
                  >
                    {img.type === 'VIDEO' ? (
                      <video src={img.url} autoPlay muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <Image 
                        src={img.url} 
                        alt={`${product.title} ${i + 1}`} 
                        fill 
                        sizes="(max-width: 640px) 64px, 96px"
                        className="object-cover" 
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Down Arrow / Scroll Next Button */}
            {product.images.length > 3 && (
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next image"
                className="hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 mt-1 cursor-pointer"
              >
                <ArrowDown size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Right Main Image Display */}
        <div className="flex-1 w-full relative">
          <div 
            className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-[#121212] shadow-2xl group transition-all duration-300"
            style={{ 
              aspectRatio: imageAspect > 0 ? imageAspect : 0.67,
              maxHeight: '88vh'
            }}
          >
            {(() => {
              const activeMedia = product.images.find((m: any) => m.url === displayImage) || { type: 'IMAGE', url: displayImage };
              if (activeMedia.type === 'VIDEO') {
                return (
                  <video 
                    key={activeMedia.url} 
                    src={activeMedia.url} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover transition-all duration-500" 
                  />
                );
              }
              return (
                <Image 
                  src={activeMedia.url} 
                  alt={product.title} 
                  fill 
                  className="object-cover transition-all duration-500 group-hover:scale-[1.02]" 
                  priority 
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    if (target.naturalWidth && target.naturalHeight) {
                      setImageAspect(target.naturalWidth / target.naturalHeight);
                    }
                  }}
                />
              );
            })()}

            {/* Circular Zoom Button in bottom-right corner as shown in reference */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              aria-label="Zoom image"
              className="absolute bottom-4 right-4 md:bottom-5 md:right-5 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 z-10 cursor-pointer"
            >
              <Search size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-white/40 text-[11px] tracking-[0.25em] uppercase mb-3">
            <span>{product.category || "New Arrival"}</span>
            <div className="w-8 h-[1px] bg-white/20" />
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-white tracking-wide uppercase leading-tight mb-4 [hyphens:none]">
            {renderProductTitle(product.title)}
          </h1>
          <p className="font-sans text-lg sm:text-xl font-medium text-white/90 tracking-wide flex items-baseline gap-4 sm:gap-5">
            <span>₹ {parseFloat(currentVariant?.price || product.price).toLocaleString("en-IN")}</span>
            <span className="text-xs sm:text-sm font-normal text-white/60 tracking-[0.25em] uppercase">{product.currencyCode || "INR"}</span>
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3 border-t border-white/5 pt-8">
          <h3 className="text-[10px] text-white/80 uppercase tracking-[0.3em] font-medium">About This Piece</h3>
          <p className="text-white/75 leading-relaxed font-normal text-sm">
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

        {/* Quantity Selection */}
        {isVariantSelected && isAvailable && availableStock > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white uppercase tracking-[0.3em] font-medium">ADD TO BAG</span>
            <div className="inline-flex items-center border border-white/20 rounded-xl bg-white/[0.04] backdrop-blur-md overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedQty((prev) => Math.max(1, prev - 1))}
                disabled={selectedQty <= 1}
                aria-label="Decrease quantity"
                className={`px-3 py-2 text-white/70 transition-all ${
                  selectedQty <= 1
                    ? "opacity-25 cursor-not-allowed"
                    : "hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
                }`}
              >
                <Minus size={13} strokeWidth={2.5} />
              </button>

              <span className="w-9 text-center text-xs font-bold tracking-wider text-white select-none">
                {selectedQty}
              </span>

              <button
                type="button"
                onClick={() => setSelectedQty((prev) => Math.min(Math.max(1, Math.min(10, availableStock)), prev + 1))}
                disabled={selectedQty >= Math.max(1, Math.min(10, availableStock))}
                aria-label="Increase quantity"
                className={`px-3 py-2 text-white/70 transition-all ${
                  selectedQty >= Math.max(1, Math.min(10, availableStock))
                    ? "opacity-25 cursor-not-allowed"
                    : "hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
                }`}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* ADD TO CART — glass, secondary */}
            <button
              onClick={handleAddToCart}
              disabled={!isVariantSelected || isOutOfStock || isMaxStockReached}
              className={`flex-1 py-4 backdrop-blur-md text-xs font-bold uppercase tracking-[0.3em] rounded-xl transition-all duration-300 ${
                !isVariantSelected
                  ? "border-2 border-dotted border-white/35 text-white/40 bg-white/[0.02] cursor-not-allowed"
                  : isOutOfStock || isMaxStockReached
                    ? "border-2 border-solid border-white/10 text-white/30 bg-white/[0.02] cursor-not-allowed"
                    : cartFeedback
                      ? "border-2 border-solid border-green-400/60 text-green-300 bg-green-400/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] cursor-pointer"
                      : "border-2 border-solid border-white/20 text-white bg-white/8 hover:bg-white/15 hover:border-white/40 cursor-pointer shadow-sm active:scale-[0.99]"
              }`}
            >
              {!isVariantSelected
                ? "Add to Cart"
                : isOutOfStock
                  ? "Out of Stock"
                  : isMaxStockReached
                    ? "Max Stock in Cart"
                    : cartFeedback
                      ? "✓ Added to Cart"
                      : "Add to Cart"}
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
              className={`px-4 py-4 rounded-xl border-2 backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
                isInWishlist(product.id) || isInWishlist(currentVariant?.id || "")
                  ? "bg-[#C81E1E]/20 border-solid border-[#C81E1E] text-[#C81E1E]"
                  : "bg-white/8 border-solid border-white/25 text-white/70 hover:text-white hover:border-white/45"
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
              className={`absolute -inset-[1.5px] rounded-xl transition-opacity duration-500 pointer-events-none ${!isVariantSelected || isOutOfStock ? 'opacity-0' : 'opacity-100'}`}
              style={{
                background: 'conic-gradient(from var(--angle, 0deg), transparent 60%, #ef4444 75%, #ff6b6b 80%, transparent 90%)',
                animation: 'spin-border 2.4s linear infinite',
                borderRadius: '0.75rem',
              }}
            />

            {/* Glass button body */}
            <button
              onClick={handleBuyNow}
              disabled={!isVariantSelected || isOutOfStock}
              className={`relative w-full py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-300 overflow-hidden
                backdrop-blur-2xl
                ${!isVariantSelected
                  ? 'border-2 border-dotted border-white/35 text-white/40 bg-white/[0.02] cursor-not-allowed'
                  : isOutOfStock
                    ? 'border-2 border-solid border-white/10 text-white/30 bg-white/[0.02] cursor-not-allowed'
                    : 'border-2 border-solid border-white/20 bg-white/8 text-white cursor-pointer hover:bg-white/12 hover:border-white/35 active:scale-[0.99]'
                }`}
              style={isVariantSelected && !isOutOfStock ? {
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
              } : {}}
            >
              {/* Glass inner highlight streak */}
              {isVariantSelected && !isOutOfStock && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
                  }}
                />
              )}

              {/* Red ambient glow beneath text */}
              {isVariantSelected && !isOutOfStock && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl opacity-30"
                  style={{ background: 'rgba(239,68,68,0.6)' }} />
              )}

              <div className="flex items-center justify-center gap-4 w-full relative z-10">
                <span className={`text-sm font-bold uppercase tracking-[0.4em] drop-shadow-sm ${!isVariantSelected || isOutOfStock ? 'text-white/30' : 'text-white'}`}>
                  {isOutOfStock ? "Out of Stock" : "Buy Now"}
                </span>
                {!isOutOfStock && (
                  <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>

              {/* Payment Options */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/BUUYNOWBUYYON.png"
                alt="UPI · VISA · Mastercard · American Express"
                style={{ width: '180px', height: 'auto' }}
                className={`relative z-10 transition-opacity duration-300 ${!isVariantSelected || isOutOfStock ? 'opacity-20' : 'opacity-65'}`}
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

        {/* Free Shipping & Secure Payment Trust Features */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 pt-6 border-t border-white/10">
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white/85 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="space-y-0.5">
              <h4 className="text-[11px] sm:text-xs font-semibold text-white tracking-wide">Free Shipping</h4>
              <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
                Across India<br />5–7 Business Days
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:gap-3.5">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white/85 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="space-y-0.5">
              <h4 className="text-[11px] sm:text-xs font-semibold text-white tracking-wide">Secure Payment</h4>
              <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
                100% Secure Checkout<br />UPI · Cards · NetBanking
              </p>
            </div>
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

      {/* Full-Screen Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close zoom"
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-50 cursor-pointer"
          >
            <X size={22} />
          </button>

          {/* Modal Image Display */}
          <div 
            className="relative w-full max-w-5xl h-[85vh] max-h-[920px] rounded-2xl overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImage}
              alt={product.title}
              fill
              className="object-contain"
              sizes="95vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
