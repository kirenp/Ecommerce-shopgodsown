'use client';

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";
import { useUI } from "@/lib/uiContext";
import { Plus, Minus } from "lucide-react";
import SizeGuideModal from "@/components/SizeGuideModal";

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

export default function QuickViewModal() {
    const { isQuickViewOpen, closeQuickView, quickViewProduct, openCartSidebar } = useUI();
    const { addToCart } = useCart();

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedQty, setSelectedQty] = useState<number>(1);
    const [displayImage, setDisplayImage] = useState("/images/placeholder.png");
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        if (quickViewProduct) {
            setSelectedColor(null);
            setSelectedSize(null);
            setSelectedQty(1);
            setDisplayImage(quickViewProduct.images[0]?.url || "/images/placeholder.png");
        }
    }, [quickViewProduct]);

    // Update image when color changes
    useEffect(() => {
        if (selectedColor && quickViewProduct) {
            const variantWithImage = quickViewProduct.variants.find((v: any) =>
                v.image && v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor)
            );
            if (variantWithImage?.image) setDisplayImage(variantWithImage.image);
        }
    }, [selectedColor, quickViewProduct]);

    const availableColors = quickViewProduct?.colors || [];

    const availableSizesForColor = useMemo(() => {
        if (!quickViewProduct) return [];
        if (!selectedColor) return sortSizesList(quickViewProduct.sizes || []);
        const sizes = quickViewProduct.variants
            .filter((v: any) => v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor))
            .map((v: any) => {
                const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === "size");
                return sizeOpt ? sizeOpt.value : null;
            })
            .filter(Boolean);
        return sortSizesList(Array.from(new Set(sizes)).map((s) => ({ label: s })));
    }, [selectedColor, quickViewProduct]);

    const currentVariant = useMemo(() => {
        if (!quickViewProduct) return null;
        return quickViewProduct.variants.find((v: any) => {
            const colorMatch = !selectedColor || v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor);
            const sizeMatch = !selectedSize || v.options.some((opt: any) => opt.name.toLowerCase() === "size" && opt.value === selectedSize);
            return colorMatch && sizeMatch;
        });
    }, [quickViewProduct, selectedColor, selectedSize]);

    const isVariantSelected = (availableColors.length === 0 || selectedColor !== null) &&
        ((availableSizesForColor.length === 0 && !quickViewProduct?.sizes?.length) || selectedSize !== null);
    const isAvailable = currentVariant ? currentVariant.available : quickViewProduct?.available;
    const availableStock = currentVariant?.quantityAvailable ?? 999;

    // Auto-clamp selected quantity when stock changes
    useEffect(() => {
        const maxVal = Math.max(1, Math.min(10, availableStock));
        if (selectedQty > maxVal) {
            setSelectedQty(maxVal);
        }
    }, [selectedSize, selectedColor, availableStock]);

    const handleAddToCart = () => {
        if (!quickViewProduct || !isVariantSelected || !isAvailable || availableStock <= 0) return;

        addToCart({
            id: quickViewProduct.id,
            variantId: currentVariant?.id || quickViewProduct.id,
            handle: quickViewProduct.handle,
            title: quickViewProduct.title,
            image: displayImage,
            color: selectedColor || "",
            size: selectedSize || "",
            price: currentVariant?.price || quickViewProduct.price,
            currencyCode: quickViewProduct.currencyCode || "INR",
            quantityAvailable: currentVariant?.quantityAvailable,
            quantity: selectedQty
        });

        closeQuickView();
        openCartSidebar();
    };

    if (!isQuickViewOpen || !quickViewProduct) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeQuickView}
            />

            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={closeQuickView}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-black transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left: Product Image */}
                <div className="w-full md:w-[60%] h-[50vh] md:h-auto bg-[#f8f8f8] p-4 flex items-center justify-center">
                    <div className="relative w-full h-full max-h-[700px] rounded-xl overflow-hidden shadow-sm border border-black/5 bg-white flex items-center justify-center">
                        {(() => {
                            const activeMedia = quickViewProduct.images.find((m: any) => m.url === displayImage) || { type: 'IMAGE', url: displayImage };
                            if (activeMedia.type === 'VIDEO') {
                                return (
                                    <video key={activeMedia.url} src={activeMedia.url} autoPlay muted loop playsInline className="w-full h-full object-contain object-center" />
                                );
                            }
                            return (
                                <Image src={activeMedia.url} alt={quickViewProduct.title} fill className="object-contain object-center" priority />
                            );
                        })()}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="font-sans text-2xl md:text-3xl text-black font-bold uppercase tracking-tight leading-tight mb-3 [hyphens:none]">
                            {renderProductTitle(quickViewProduct.title)}
                        </h2>
                        <div className="flex items-baseline gap-4">
                            <p className="text-xl font-medium text-black">
                                ₹ {parseFloat(currentVariant?.price || quickViewProduct.price).toLocaleString("en-IN")}
                            </p>
                            <span className="text-xs font-normal text-black/60 tracking-[0.25em] uppercase">{quickViewProduct.currencyCode || "INR"}</span>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Colors */}
                        {availableColors.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                                    Color {selectedColor && <span className="font-normal text-black/60 capitalize">— {selectedColor}</span>}
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {availableColors.map((c: any, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => { setSelectedColor(c.label); setSelectedSize(null); }}
                                            className={`relative w-12 h-16 rounded-md overflow-hidden cursor-pointer transition-all ${selectedColor === c.label ? "ring-2 ring-black ring-offset-2" : "border border-gray-200 hover:border-black/30"
                                                }`}
                                            title={c.label}
                                        >
                                            {/* Using the image of the variant for the color swatch if available, else plain color */}
                                            {(() => {
                                                const vImage = quickViewProduct.variants.find((v: any) => v.image && v.options.some((o: any) => o.value === c.label))?.image;
                                                return vImage ? (
                                                    <Image src={vImage} alt={c.label} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full" style={{ backgroundColor: c.color.toLowerCase() }} />
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {(availableSizesForColor.length > 0 || (availableColors.length === 0 && quickViewProduct.sizes?.length > 0)) && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                                        Size {selectedSize && <span className="font-normal text-black/60 uppercase">— {selectedSize}</span>}
                                    </h4>
                                    <button onClick={() => setShowSizeGuide(true)} className="text-[10px] text-gray-500 hover:text-black uppercase tracking-wider underline underline-offset-4 transition-colors">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {sortSizesList(availableSizesForColor.length > 0 ? availableSizesForColor : quickViewProduct.sizes || []).map((s: any, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSize(s.label)}
                                            className={`min-w-[3rem] h-10 px-3 border rounded text-xs font-medium uppercase transition-all ${selectedSize === s.label
                                                ? "border-black bg-black text-white shadow-md"
                                                : "border-gray-200 text-black hover:border-black"
                                                }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isVariantSelected && isAvailable && availableStock > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                                    ADD TO BAG
                                </h4>
                                <div className="inline-flex items-center border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedQty((prev) => Math.max(1, prev - 1))}
                                        disabled={selectedQty <= 1}
                                        aria-label="Decrease quantity"
                                        className={`px-3 py-2 text-black/70 transition-all ${
                                            selectedQty <= 1
                                                ? "opacity-25 cursor-not-allowed"
                                                : "hover:bg-black/10 hover:text-black cursor-pointer active:scale-95"
                                        }`}
                                    >
                                        <Minus size={13} strokeWidth={2.5} />
                                    </button>

                                    <span className="w-10 text-center text-xs font-bold tracking-wider text-black select-none">
                                        {selectedQty}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedQty((prev) => Math.min(Math.max(1, Math.min(10, availableStock)), prev + 1))}
                                        disabled={selectedQty >= Math.max(1, Math.min(10, availableStock))}
                                        aria-label="Increase quantity"
                                        className={`px-3 py-2 text-black/70 transition-all ${
                                            selectedQty >= Math.max(1, Math.min(10, availableStock))
                                                ? "opacity-25 cursor-not-allowed"
                                                : "hover:bg-black/10 hover:text-black cursor-pointer active:scale-95"
                                        }`}
                                    >
                                        <Plus size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isVariantSelected && (availableColors.length > 0 || quickViewProduct.sizes?.length > 0) && (
                            <p className="text-red-500 text-xs font-medium">Please select all options before adding to cart.</p>
                        )}

                        {(!isAvailable || availableStock <= 0) && isVariantSelected && (
                            <p className="text-red-500 text-xs font-medium">This variant is currently out of stock.</p>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleAddToCart}
                            disabled={!isVariantSelected || !isAvailable || availableStock <= 0}
                            className={`w-full py-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${!isVariantSelected || !isAvailable || availableStock <= 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-black hover:bg-black/90 text-white hover:-translate-y-0.5"
                                }`}
                        >
                            {!isVariantSelected ? "Add To Cart" : (!isAvailable || availableStock <= 0) ? "Out of Stock" : "Add To Cart"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Size Guide Modal Overlay */}
            <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} product={quickViewProduct} />
        </div>
    );
}
