'use client';

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";
import { useUI } from "@/lib/uiContext";

export default function QuickViewModal() {
    const { isQuickViewOpen, closeQuickView, quickViewProduct, openCartSidebar } = useUI();
    const { addToCart } = useCart();

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [displayImage, setDisplayImage] = useState("/images/placeholder.png");
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        if (quickViewProduct) {
            setSelectedColor(null);
            setSelectedSize(null);
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
        if (!selectedColor) return quickViewProduct.sizes || [];
        const sizes = quickViewProduct.variants
            .filter((v: any) => v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value === selectedColor))
            .map((v: any) => {
                const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === "size");
                return sizeOpt ? sizeOpt.value : null;
            })
            .filter(Boolean);
        return Array.from(new Set(sizes)).map((s) => ({ label: s }));
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

    const handleAddToCart = () => {
        if (!quickViewProduct || !isVariantSelected || !isAvailable) return;

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
                                    <video key={activeMedia.url} src={activeMedia.url} autoPlay muted loop playsInline controls className="w-full h-full object-contain object-center" />
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
                        <h2 className="font-brand text-3xl text-black font-semibold leading-tight mb-2">
                            {quickViewProduct.title}
                        </h2>
                        <div className="flex items-center gap-3">
                            <p className="text-xl font-medium text-black">
                                ₹{parseFloat(currentVariant?.price || quickViewProduct.price).toLocaleString("en-IN")}
                            </p>
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
                                    {(availableSizesForColor.length > 0 ? availableSizesForColor : quickViewProduct.sizes || []).map((s: any, i: number) => (
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

                        {!isVariantSelected && (availableColors.length > 0 || quickViewProduct.sizes?.length > 0) && (
                            <p className="text-red-500 text-xs font-medium">Please select all options before adding to cart.</p>
                        )}

                        {!isAvailable && isVariantSelected && (
                            <p className="text-red-500 text-xs font-medium">This variant is currently out of stock.</p>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleAddToCart}
                            disabled={!isVariantSelected || !isAvailable}
                            className={`w-full py-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${!isVariantSelected || !isAvailable
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-black hover:bg-black/90 text-white hover:-translate-y-0.5"
                                }`}
                        >
                            Add To Cart
                        </button>
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
