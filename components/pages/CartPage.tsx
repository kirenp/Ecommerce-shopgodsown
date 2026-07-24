'use client';

import { useCart } from "@/lib/cartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { usePreview } from "@/lib/preview";

export default function CartPageContent() {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const { getPreviewPath } = usePreview();

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12 text-luxury-offwhite">
          <p className="mb-3">Your Bag</p>
          <h1 className="text-5xl md:text-7xl">
            {items.length === 0 ? "Empty" : `Item${items.length > 1 ? "s" : ""} - ${items.length}`}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center space-y-8 border-t border-white/5 text-luxury-offwhite">
            <p>Your cart is empty.</p>
            <Link
              href={getPreviewPath("/catalog")}
              className="inline-block bg-luxury-offwhite text-black px-12 py-4 hover:opacity-80 transition-all duration-300 rounded-xl"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.variantId}-${item.color}-${item.size}`}
                  className="flex gap-6 bg-white/3 backdrop-blur-sm border border-white/5 rounded-2xl p-6"
                >
                  {/* Image */}
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3 text-luxury-offwhite">
                    <h3>{item.title}</h3>
                    <div className="flex gap-6">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <p>
                      ₹{parseFloat(item.price).toLocaleString("en-IN")}
                    </p>

                    {/* Qty + remove */}
                    <div className="flex items-center gap-4 pt-2 text-luxury-offwhite">
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-2 hover:bg-white/10 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-4 py-2 border-x border-white/10">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= (item.quantityAvailable ?? 999)}
                          className={`px-3 py-2 transition-colors ${
                            item.quantity >= (item.quantityAvailable ?? 999)
                              ? "opacity-50 cursor-not-allowed bg-white/5"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-luxury-offwhite border border-dotted border-luxury-offwhite/40 px-6 py-3 rounded-xl hover:bg-white/10 transition-colors mt-4 inline-block">
                Clear cart
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-6 text-luxury-offwhite">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8 space-y-6">
                <h2 className="text-2xl">Order Summary</h2>
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{parseFloat(subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span className="text-green-500 text-sm font-semibold tracking-wide uppercase">Free</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between text-lg">
                  <span>Total</span>
                  <span>₹{parseFloat(subtotal).toLocaleString("en-IN")}</span>
                </div>
                <Link
                  href={getPreviewPath("/checkout")}
                  className="block text-center w-full py-4 bg-luxury-offwhite text-black rounded-xl hover:opacity-90 transition-all duration-300 mt-2"
                >
                  Proceed to Checkout
                </Link>
                <Link href={getPreviewPath("/catalog")} className="block text-center border border-dotted border-luxury-offwhite/40 py-4 rounded-xl hover:bg-white/10 transition-colors mt-4">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
