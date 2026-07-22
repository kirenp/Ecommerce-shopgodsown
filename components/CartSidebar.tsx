'use client';

import { useUI } from "@/lib/uiContext";
import { useCart, CartItem } from "@/lib/cartContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getRecommendedProducts } from "@/app/actions";
import { usePreview } from "@/lib/preview";

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

export default function CartSidebar() {
    const { isCartSidebarOpen, closeCartSidebar } = useUI();
    const { items, removeFromCart, updateQuantity, subtotal, itemCount, addToCart } = useCart();
    const [recommended, setRecommended] = useState<any[]>([]);
    const [productsDetails, setProductsDetails] = useState<Record<string, any>>({});
    const { getPreviewPath } = usePreview();

    useEffect(() => {
        if (!isCartSidebarOpen) return;
        const fetchRecommended = async () => {
            if (recommended.length === 0) {
                const products = await getRecommendedProducts(2);
                setRecommended(products);
            }
        };
        fetchRecommended();
    }, [isCartSidebarOpen]);

    // Fetch product details for cart items to populate available sizes dropdown
    useEffect(() => {
        if (!isCartSidebarOpen || items.length === 0) return;
        
        const fetchDetails = async () => {
            const missingHandles = items
                .map(item => item.handle)
                .filter(handle => handle && !productsDetails[handle]);
                
            if (missingHandles.length === 0) return;
            
            const fetched: Record<string, any> = {};
            await Promise.all(
                missingHandles.map(async (handle) => {
                    try {
                        const res = await fetch(`/api/products/${handle}`);
                        if (res.ok) {
                            const data = await res.json();
                            fetched[handle] = data;
                        }
                    } catch (e) {
                        console.error(`Failed to fetch product details for ${handle}:`, e);
                    }
                })
            );
            
            if (Object.keys(fetched).length > 0) {
                setProductsDetails(prev => ({ ...prev, ...fetched }));
            }
        };
        
        fetchDetails();
    }, [isCartSidebarOpen, items]);

    const getAvailableSizes = (item: CartItem) => {
        const details = productsDetails[item.handle];
        if (!details) return [];
        
        let sizesList: any[] = [];
        if (!item.color) {
            sizesList = details.sizes || [];
        } else {
            const sizes = details.variants
                .filter((v: any) => v.options.some((opt: any) => opt.name.toLowerCase() === "color" && opt.value.toLowerCase() === item.color.toLowerCase()))
                .map((v: any) => {
                    const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === "size");
                    return sizeOpt ? sizeOpt.value : null;
                })
                .filter(Boolean);
            sizesList = Array.from(new Set(sizes)).map(s => ({ label: s }));
        }
        
        return sortSizesList(sizesList);
    };

    const handleSizeChange = (item: CartItem, newSize: string) => {
        const details = productsDetails[item.handle];
        if (!details) return;
        
        const matchingVariant = details.variants.find((v: any) => {
            const sizeOpt = v.options.find((opt: any) => opt.name.toLowerCase() === 'size');
            const colorOpt = v.options.find((opt: any) => opt.name.toLowerCase() === 'color');
            const sizeMatch = sizeOpt && sizeOpt.value.toUpperCase() === newSize.toUpperCase();
            const colorMatch = !colorOpt || !item.color || colorOpt.value.toLowerCase() === item.color.toLowerCase();
            return sizeMatch && colorMatch;
        });
        
        if (matchingVariant) {
            removeFromCart(item.variantId);
            addToCart({
                id: item.id,
                variantId: matchingVariant.id,
                handle: item.handle,
                title: item.title,
                image: matchingVariant.image || item.image,
                color: item.color,
                size: newSize,
                price: matchingVariant.price,
                currencyCode: item.currencyCode,
                quantityAvailable: matchingVariant.quantityAvailable,
                quantity: item.quantity
            });
        }
    };

    if (!isCartSidebarOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[100] transition-opacity backdrop-blur-sm"
                onClick={closeCartSidebar}
            />

            {/* Sidebar Content */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform duration-300 translate-x-0">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-black font-bold uppercase tracking-wider text-sm">
                        My Cart ({itemCount})
                    </h2>
                    <button onClick={closeCartSidebar} className="p-2 text-black/50 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-gray-50/50">

                    {/* Cart Items */}
                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="py-12 text-center text-black/40">
                                <p className="text-sm">Your cart is empty.</p>
                            </div>
                        ) : (
                            items.map((item: CartItem, index: number) => (
                                <div key={`${item.variantId}-${index}`} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl relative shadow-sm hover:shadow-md transition-shadow">
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeFromCart(item.variantId)}
                                        className="absolute top-3 right-3 text-black/30 hover:text-red-500 transition-colors bg-white rounded-full"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    {/* Image */}
                                    <div className="relative w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex flex-col justify-between py-1 pr-6 flex-1">
                                        <div>
                                            <div className="flex items-end gap-2 mb-1">
                                                <span className="text-sm font-bold text-black">₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                                                <span className="text-[10px] line-through text-black/40">₹{(parseFloat(item.price) * 1.5).toLocaleString('en-IN')}</span>
                                                <span className="text-[10px] text-[#00C853] font-bold">33% OFF</span>
                                            </div>
                                            <h3 className="text-xs font-medium text-black leading-tight mb-2 line-clamp-2">{item.title}</h3>
                                            <p className="text-[10px] text-black/50 mb-3">
                                                Details - <span className="uppercase">{item.size}</span>, <span className="capitalize">{item.color}</span>
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Size select dropdown */}
                                            <div className="relative border border-gray-200 rounded text-[10px] font-medium text-black bg-white flex items-center">
                                                <span className="pl-2 pointer-events-none select-none uppercase">SIZE:</span>
                                                <select
                                                    value={item.size}
                                                    onChange={(e) => handleSizeChange(item, e.target.value)}
                                                    className="bg-transparent pl-1 pr-6 py-1 text-[10px] font-medium text-black outline-none cursor-pointer appearance-none uppercase"
                                                >
                                                    {(() => {
                                                        const sizes = getAvailableSizes(item);
                                                        if (sizes.length === 0) {
                                                            return <option value={item.size}>{item.size}</option>;
                                                        }
                                                        return sizes.map((s: any) => {
                                                            const label = typeof s === 'string' ? s : s.label;
                                                            return (
                                                                <option key={label} value={label}>
                                                                    {label}
                                                                </option>
                                                            );
                                                        });
                                                    })()}
                                                </select>
                                                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-black/50 absolute right-1.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>

                                            {/* Quantity select dropdown */}
                                            <div className="relative border border-gray-200 rounded text-[10px] font-medium text-black bg-white flex items-center">
                                                <span className="pl-2 pointer-events-none select-none uppercase">QTY:</span>
                                                <select
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value))}
                                                    className="bg-transparent pl-1 pr-6 py-1 text-[10px] font-medium text-black outline-none cursor-pointer appearance-none"
                                                >
                                                    {Array.from({ length: Math.max(item.quantity, Math.min(10, item.quantityAvailable ?? 10)) }, (_, i) => i + 1).map((q) => (
                                                        <option key={q} value={q}>
                                                            {q}
                                                        </option>
                                                    ))}
                                                </select>
                                                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-black/50 absolute right-1.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Recently Viewed */}
                    {recommended.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-4">You May Also Like</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {recommended.map((prod: any) => (
                                    <Link href={getPreviewPath(`/products/${prod.handle}`)} key={prod.id} onClick={closeCartSidebar} className="bg-white border border-gray-100 rounded-xl overflow-hidden relative shadow-sm group cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 border-b border-gray-100">
                                            <Image src={prod.image} alt={prod.title} fill className="object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                                            {/* Quick Add icon */}
                                            <div 
                                                className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:scale-110 transition-transform text-black z-20"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const variant = prod.variants?.[0] || prod;
                                                    addToCart({
                                                        id: prod.id,
                                                        variantId: variant.id,
                                                        handle: prod.handle,
                                                        title: prod.title,
                                                        image: prod.image,
                                                        color: variant.options?.find((o: any) => o.name.toLowerCase() === 'color')?.value || '',
                                                        size: variant.options?.find((o: any) => o.name.toLowerCase() === 'size')?.value || '',
                                                        price: variant.price || prod.price,
                                                        currencyCode: prod.currencyCode || "INR"
                                                    });
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-[10px] text-black font-medium leading-tight line-clamp-2 mb-1">{prod.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-xs font-bold text-black">₹{parseFloat(prod.price).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Continue Shopping Button (always visible within scroll area) */}
                    <div className="pt-2">
                        <Link
                            href={getPreviewPath("/catalog")}
                            onClick={closeCartSidebar}
                            className="block w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 hover:border-black hover:text-black hover:bg-gray-50 text-center font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col pl-1">
                            <span className="text-lg font-bold text-black leading-none">₹{parseFloat(subtotal).toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-black/40 font-bold uppercase tracking-widest mt-1">Subtotal</span>
                        </div>
                        <Link
                            href={getPreviewPath("/cart")}
                            onClick={closeCartSidebar}
                            className="flex-1 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-black uppercase tracking-widest py-4 text-center rounded-lg shadow-[0_4px_14px_0_rgba(0,230,118,0.39)] hover:shadow-[0_6px_20px_rgba(0,230,118,0.5)] hover:-translate-y-0.5 transition-all"
                        >
                            Proceed to Buy
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
