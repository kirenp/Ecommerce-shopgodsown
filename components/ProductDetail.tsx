'use client';

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";

interface ProductDetailProps {
  product: any;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState(product.images[0]?.url || "/images/placeholder.png");
  const [cartFeedback, setCartFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
    if (!selectedColor) return product.sizes || [];
    const sizes = product.variants
      .filter((v: any) => v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor))
      .map((v: any) => {
        const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === "size");
        return sizeOpt ? sizeOpt.value : null;
      })
      .filter(Boolean);
    return Array.from(new Set(sizes)).map((s) => ({ label: s }));
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
    });
    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
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
                <video key={activeMedia.url} src={activeMedia.url} autoPlay muted loop playsInline controls className="w-full h-full object-cover transition-all duration-700" />
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
          <p className="text-xl font-light text-white/70 tracking-widest">
            ₹{parseFloat(currentVariant?.price || product.price).toLocaleString("en-IN")} {product.currencyCode || "INR"}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3 border-t border-white/5 pt-8">
          <h3 className="text-[10px] text-white/30 uppercase tracking-[0.3em]">About This Piece</h3>
          <p className="text-white/50 leading-relaxed font-light">
            {product.description || "A luxury piece designed to disrupt. Precision-tailored for the modern presence."}
          </p>
        </div>

        {/* Colors + Sizes */}
        <div className="space-y-8">
          {availableColors.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/30 uppercase tracking-[0.3em]">
                Color
                {selectedColor && <span className="text-white/70 ml-3 font-medium">— {selectedColor}</span>}
              </h4>
              <div className="flex flex-wrap gap-4">
                {availableColors.map((c: any, i: number) => (
                  <div key={i} className="group relative" onClick={() => { setSelectedColor(c.label); setSelectedSize(null); }}>
                    <div
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${selectedColor === c.label ? "border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.2)]" : "border-white/15 hover:scale-110 hover:border-white/40"}`}
                      style={{ backgroundColor: c.color.toLowerCase() }}
                      title={c.label}
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-white/0 group-hover:text-white/50 uppercase tracking-widest whitespace-nowrap transition-all duration-300">
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
                <h4 className="text-[10px] text-white/30 uppercase tracking-[0.3em]">
                  Size
                  {selectedSize && <span className="text-white/70 ml-3 font-medium">— {selectedSize}</span>}
                </h4>
                <button onClick={() => setShowSizeGuide(true)} className="text-[10px] text-white/50 hover:text-white uppercase tracking-wider underline underline-offset-4 font-medium transition-colors">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {(availableSizesForColor.length > 0 ? availableSizesForColor : product.sizes || []).map((s: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(s.label)}
                    className={`w-14 h-14 border text-[11px] font-medium uppercase tracking-wider rounded-xl transition-all duration-300 ${selectedSize === s.label ? "bg-white text-black border-white" : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"}`}
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
          <p className="text-white/20 text-[10px] tracking-widest uppercase">
            {!selectedColor ? "← Select a color to continue" : "← Now select a size"}
          </p>
        )}

        {/* Stock */}
        <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-[10px] text-white/40 uppercase tracking-widest">
            {isAvailable ? "In Stock — Ready to ship" : "Out of Stock"}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {/* ADD TO CART — glass, secondary */}
          <button
            onClick={handleAddToCart}
            disabled={!isVariantSelected || !isAvailable}
            className={`w-full py-4 bg-white/8 backdrop-blur-md border text-xs font-bold uppercase tracking-[0.3em] rounded-xl transition-all duration-500 ${!isVariantSelected || !isAvailable
              ? "border-white/5 text-white/20 cursor-not-allowed"
              : cartFeedback
                ? "border-green-400/50 text-green-300 bg-green-400/10"
                : "border-white/15 text-white hover:bg-white/15 hover:border-white/30"
              }`}
          >
            {cartFeedback ? "✓ Added to Cart" : "Add to Cart"}
          </button>

          {/* BUY NOW — redesigned per reference */}
          <div className="relative group mt-2">
            {/* Glow effect behind the button */}
            <div className={`absolute -inset-1 rounded-xl blur-sm opacity-10 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${!isVariantSelected || !isAvailable ? 'hidden' : 'bg-gradient-to-r from-luxury-kasavu to-luxury-gold'}`}></div>

            <button
              disabled={!isVariantSelected || !isAvailable}
              className={`relative w-full py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-500 overflow-hidden ${!isVariantSelected || !isAvailable
                ? "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                : "bg-black hover:bg-black/90 text-white border border-white/10 shadow-[0_4px_24px_rgba(229,196,83,0.15)] hover:shadow-[0_8px_32px_rgba(229,196,83,0.25)] ring-1 ring-white/10"
                }`}
            >
              <div className="flex items-center justify-center gap-4 w-full">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-white">Buy Now</span>

                {/* Right Chevron */}
                <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${!isVariantSelected || !isAvailable ? 'text-white/20' : 'text-white'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {/* UPI Icons Group - Centered below */}
              <div className={`flex items-center justify-center gap-2 ${!isVariantSelected || !isAvailable ? 'opacity-20' : 'opacity-100'}`}>
                {/* Google Pay */}
                <div className="w-10 h-6 rounded bg-white flex items-center justify-center px-2 py-1 border border-black/5 z-30">
                  <svg viewBox="0 0 40 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.8 17.5v-2.1h4.1c-.2-1-.8-1.8-1.6-2.3l2.8-2.2c1.8 1.7 2.8 4.2 2.8 7s-.1 1.2-.2 1.8h-7.9z" fill="#4285F4" />
                    <path d="M11.2 17.5c0-.8.1-1.6.4-2.3l-2.8-2.2C8.3 14.2 8 15.8 8 17.5s.3 3.3.8 4.6l2.8-2.2c-.3-.7-.4-1.5-.4-2.4z" fill="#FBBC05" />
                    <path d="M18.8 24.2c2 0 3.7-.7 5-1.8l-2.8-2.2c-.6.4-1.4.6-2.2.6-1.7 0-3.1-1.1-3.6-2.6l-2.8 2.2C13.9 22.8 16.2 24.2 18.8 24.2z" fill="#34A853" />
                    <path d="M18.8 10.8c1.5 0 2.9.5 4 1.5l2.8-2.2C23.7 8.5 21.4 7.6 18.8 7.6c-2.6 0-4.9 1.4-6.3 3.6l2.8 2.2c.5-1.5 1.9-2.6 3.5-2.6z" fill="#EA4335" />
                  </svg>
                </div>
                {/* PhonePe */}
                <div className="w-10 h-6 rounded bg-white flex items-center justify-center border border-black/5 z-20 text-[6.5px] font-black text-[#5f259f] tracking-tight">
                  PhonePe
                </div>
                {/* Paytm */}
                <div className="w-10 h-6 rounded bg-white flex items-center justify-center border border-black/5 z-10 text-[8px] font-black text-[#00baf2] italic">
                  Paytm
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <h4 className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Heritage Shipping</h4>
            <p className="text-[10px] text-white/30 uppercase tracking-widest leading-loose">Kerala to Worldwide<br />5–7 Business Days</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Luxury Packaging</h4>
            <p className="text-[10px] text-white/30 uppercase tracking-widest leading-loose">Eco-Friendly<br />Premium Branding</p>
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
