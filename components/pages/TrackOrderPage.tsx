"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePreview } from "@/lib/preview";

export default function TrackOrderPageContent() {
  const searchParams = useSearchParams();
  const { getPreviewPath } = usePreview();

  const [orderNumber, setOrderNumber] = useState(searchParams?.get("orderId") || "");
  const [emailOrPhone, setEmailOrPhone] = useState(searchParams?.get("contact") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState<any | null>(null);

  const handleTrackOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!orderNumber.trim()) {
      setError("Please enter your Order Number");
      return;
    }
    if (!emailOrPhone.trim()) {
      setError("Please enter your Email or Mobile Number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          emailOrPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order not found. Please verify your order number and contact details.");
      }

      setOrderData(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to fetch order status");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if URL params are present
  useEffect(() => {
    if (searchParams?.get("orderId") && searchParams?.get("contact")) {
      handleTrackOrder();
    }
  }, []);

  const STAGES = [
    { id: 1, label: "Order Placed", desc: "Confirmed" },
    { id: 2, label: "Processing", desc: "Quality Check" },
    { id: 3, label: "Dispatched", desc: "In Transit" },
    { id: 4, label: "Out for Delivery", desc: "Nearby Hub" },
    { id: 5, label: "Delivered", desc: "Handed Over" },
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#C81E1E]/20">
      <Navbar />

      <div className="pt-36 pb-24 px-6 md:px-12 max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase font-mono">Real-Time Logistics</p>
          <h1 className="font-brand text-4xl md:text-6xl font-light text-white tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs text-white/60 leading-relaxed tracking-wide font-medium">
            Enter your order number and registered email or phone to check live delivery progress and courier details.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="bg-white/4 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
          <form onSubmit={handleTrackOrder} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/50 uppercase tracking-widest block mb-2 font-bold pl-1">
                  Order Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. #1001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E] transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] text-white/50 uppercase tracking-widest block mb-2 font-bold pl-1">
                  Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7909192145"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E] transition-all font-mono"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#ff5252] font-medium pl-1 animate-pulse">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-white/90 text-black py-4 rounded-xl text-xs font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Searching Shipment...</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>Track Shipment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Results Section */}
        {orderData && (
          <div className="space-y-10 animate-fade-in">
            {/* Status Overview Card */}
            <div className="bg-white/4 border border-white/10 rounded-3xl p-6 md:p-10 space-y-8 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Order Number</span>
                  <h3 className="text-2xl font-brand text-white font-medium">{orderData.orderNumber}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Status</span>
                  <p className="text-sm font-bold text-[#00C853] uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    <CheckCircle2 size={16} />
                    <span>{orderData.fulfillmentStatus}</span>
                  </p>
                </div>
              </div>

              {/* 5-Stage Delivery Timeline */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Delivery Progress</p>
                
                <div className="grid grid-cols-5 gap-2 relative">
                  {STAGES.map((stage) => {
                    const isCompleted = orderData.currentStep >= stage.id;
                    const isCurrent = orderData.currentStep === stage.id;

                    return (
                      <div key={stage.id} className="text-center space-y-2 relative z-10">
                        <div
                          className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                            isCompleted
                              ? "bg-[#00C853] text-black shadow-[0_0_15px_rgba(0,200,83,0.4)]"
                              : isCurrent
                              ? "bg-[#C81E1E] text-white animate-pulse shadow-[0_0_15px_rgba(200,30,30,0.5)]"
                              : "bg-white/10 text-white/30 border border-white/10"
                          }`}
                        >
                          {isCompleted ? "✓" : stage.id}
                        </div>
                        <div>
                          <p className={`text-[11px] font-bold uppercase tracking-wider ${isCompleted || isCurrent ? "text-white" : "text-white/30"}`}>
                            {stage.label}
                          </p>
                          <p className="text-[9px] text-white/40 font-mono hidden sm:block">
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier & Address Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Courier Partner</span>
                  <p className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={14} className="text-[#00C853]" />
                    {orderData.trackingCompany}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Tracking Number</span>
                  <p className="font-mono text-white/90">{orderData.trackingNumber}</p>
                  {orderData.trackingUrl && (
                    <a
                      href={orderData.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#00C853] hover:underline font-bold uppercase tracking-wider pt-1"
                    >
                      <span>Open Carrier Site</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Destination</span>
                  <p className="text-white/80 leading-relaxed font-medium">{orderData.shippingAddress}</p>
                </div>
              </div>
            </div>

            {/* Ordered Items Summary */}
            <div className="bg-white/4 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest font-sans">
                Items in Shipment ({orderData.lineItems?.length || 1})
              </h4>

              <div className="space-y-4 divide-y divide-white/10">
                {orderData.lineItems?.map((item: any, idx: number) => (
                  <div key={idx} className="pt-4 first:pt-0 flex items-center gap-4">
                    {item.image && (
                      <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider truncate">{item.title}</h5>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-mono">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">
                      ₹{parseFloat(item.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
