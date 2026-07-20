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
        <div className="mb-12">
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-3">Your Bag</p>
          <h1 className="font-brand text-5xl md:text-7xl font-light text-white tracking-tight">
            {items.length === 0 ? "Empty" : `${items.length} Item${items.length > 1 ? "s" : ""}`}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center space-y-8 border-t border-white/5">
            <p className="text-white/30 text-sm tracking-widest uppercase">Your cart is empty.</p>
            <Link
              href={getPreviewPath("/catalog")}
              className="inline-block bg-white text-black px-12 py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-white/80 transition-all duration-300"
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
                  <div className="flex-1 space-y-3">
                    <h3 className="text-white text-sm font-medium uppercase tracking-widest">{item.title}</h3>
                    <div className="flex gap-6 text-white/40 text-xs uppercase tracking-widest">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <p className="text-white font-medium text-sm tracking-widest">
                      ₹{parseFloat(item.price).toLocaleString("en-IN")}
                    </p>

                    {/* Qty + remove */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-4 py-2 text-white text-xs font-medium border-x border-white/10">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= (item.quantityAvailable ?? 999)}
                          className={`px-3 py-2 transition-colors ${
                            item.quantity >= (item.quantityAvailable ?? 999)
                              ? "text-white/20 cursor-not-allowed bg-white/5"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-white/20 hover:text-white/40 text-[10px] tracking-widest uppercase transition-colors mt-4">
                Clear cart
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8 space-y-6">
                <h2 className="font-brand text-2xl font-light text-white">Order Summary</h2>
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <div className="flex justify-between text-white/50 text-xs uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{parseFloat(subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-xs uppercase tracking-widest">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between text-white font-medium text-sm uppercase tracking-widest">
                  <span>Total</span>
                  <span>₹{parseFloat(subtotal).toLocaleString("en-IN")}</span>
                </div>
                <Link
                  href={getPreviewPath("/checkout")}
                  className="block text-center w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase rounded-xl hover:bg-white/90 transition-all duration-300 mt-2"
                >
                  Proceed to Checkout
                </Link>
                <Link href={getPreviewPath("/catalog")} className="block text-center text-white/30 hover:text-white text-[10px] tracking-widest uppercase transition-colors">
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
