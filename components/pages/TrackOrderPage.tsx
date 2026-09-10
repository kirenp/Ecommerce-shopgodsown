"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, ArrowRight, ExternalLink, ShieldCheck, Navigation, Calendar, AlertTriangle, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePreview } from "@/lib/preview";

// ── Shiprocket activity type from the API ──
interface ShiprocketActivity {
  date: string;
  location: string;
  activity: string;
  scanType: string;
  scanTypeLabel: string;
}

interface ShiprocketTrackingData {
  currentStatus: string;
  currentStatusCode: string;
  estimatedDelivery: string | null;
  courierName: string;
  awbNumber: string;
  pickupDate: string | null;
  deliveredDate: string | null;
  activities: ShiprocketActivity[];
}

export default function TrackOrderPageContent() {
  const searchParams = useSearchParams();
  const { getPreviewPath } = usePreview();

  const [orderNumber, setOrderNumber] = useState(searchParams?.get("orderId") || "");
  const [emailOrPhone, setEmailOrPhone] = useState(searchParams?.get("contact") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState<any | null>(null);
  const [shiprocketData, setShiprocketData] = useState<ShiprocketTrackingData | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);

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
      setShiprocketData(data.shiprocketTracking || null);
      setShowAllActivities(false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch order status");
      setOrderData(null);
      setShiprocketData(null);
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
    { id: 1, label: "Order Placed", desc: "Confirmed", icon: Package },
    { id: 2, label: "Dispatched", desc: "Picked Up", icon: CheckCircle2 },
    { id: 3, label: "In Transit", desc: "On the Way", icon: Truck },
    { id: 4, label: "Out for Delivery", desc: "Nearby Hub", icon: Navigation },
    { id: 5, label: "Delivered", desc: "Handed Over", icon: CheckCircle2 },
  ];

  // ── Helper: format dates nicely ──
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Helper: icon + color for scan type ──
  const getActivityStyle = (scanType: string) => {
    switch (scanType) {
      case "DL":
        return { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", glow: "shadow-[0_0_12px_rgba(16,185,129,0.25)]" };
      case "OFD":
        return { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", glow: "shadow-[0_0_12px_rgba(245,158,11,0.25)]" };
      case "IT":
        return { color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30", glow: "" };
      case "PU":
        return { color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30", glow: "" };
      case "RTO":
      case "NDR":
      case "CANCELED":
      case "EXCEPTION":
        return { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30", glow: "" };
      default:
        return { color: "text-white/60", bg: "bg-white/8", border: "border-white/15", glow: "" };
    }
  };

  // Determine special status flags
  const isRTO = shiprocketData?.currentStatusCode === "RTO";
  const isNDR = shiprocketData?.currentStatusCode === "NDR";
  const isCanceled = shiprocketData?.currentStatusCode === "CANCELED";
  const hasSpecialStatus = isRTO || isNDR || isCanceled;

  // How many activities to show initially
  const INITIAL_ACTIVITY_COUNT = 5;
  const visibleActivities = shiprocketData?.activities
    ? showAllActivities
      ? shiprocketData.activities
      : shiprocketData.activities.slice(0, INITIAL_ACTIVITY_COUNT)
    : [];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#C81E1E]/20">
      <Navbar />

      <div className="pt-36 pb-24 px-6 md:px-12 max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase font-montserrat-bold font-bold">Real-Time Logistics</p>
          <h1 className="font-montserrat-bold text-4xl md:text-6xl font-bold text-white tracking-tight">
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
                  placeholder="e.g. john@example.com"
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
          <div className="space-y-8 animate-fade-in">

            {/* ── Special Status Banner (RTO / NDR / Canceled) ── */}
            {hasSpecialStatus && (
              <div className={`rounded-2xl p-5 border flex items-start gap-4 ${
                isCanceled
                  ? "bg-red-500/10 border-red-500/30"
                  : isRTO
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-orange-500/10 border-orange-500/30"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCanceled ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {isRTO ? <RotateCcw size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${
                    isCanceled ? "text-red-400" : "text-amber-400"
                  }`}>
                    {isCanceled ? "Order Cancelled" : isRTO ? "Return to Origin" : "Delivery Exception"}
                  </h4>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    {isCanceled
                      ? "This shipment has been cancelled. Please contact support for more information."
                      : isRTO
                      ? "Your shipment is being returned to the origin. This usually happens after a failed delivery attempt."
                      : "There was an issue with the delivery of your shipment. Our team is working on it."}
                  </p>
                </div>
              </div>
            )}

            {/* ── Status Overview Card ── */}
            <div className="bg-white/4 border border-white/10 rounded-3xl p-6 md:p-10 space-y-8 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Order Number</span>
                  <h3 className="text-2xl font-brand text-white font-medium">{orderData.orderNumber}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Status</span>
                  <p className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 justify-end ${
                    hasSpecialStatus ? (isCanceled ? "text-red-400" : "text-amber-400") : "text-[#00C853]"
                  }`}>
                    {hasSpecialStatus ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{shiprocketData?.currentStatus || orderData.fulfillmentStatus}</span>
                  </p>
                </div>
              </div>

              {/* ── Estimated Delivery Banner ── */}
              {shiprocketData?.estimatedDelivery && !hasSpecialStatus && orderData.currentStep < 5 && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400/60 uppercase tracking-widest font-bold block">Estimated Delivery</span>
                    <p className="text-sm font-bold text-emerald-400">{formatDate(shiprocketData.estimatedDelivery)}</p>
                  </div>
                </div>
              )}

              {/* ── 5-Stage Delivery Timeline ── */}
              {!hasSpecialStatus && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Delivery Progress</p>
                  
                  {/* Progress bar connecting stages */}
                  <div className="relative">
                    <div className="grid grid-cols-5 gap-2 relative z-10">
                      {STAGES.map((stage) => {
                        const isCompleted = orderData.currentStep >= stage.id;
                        const isCurrent = orderData.currentStep === stage.id;
                        const StageIcon = stage.icon;

                        return (
                          <div key={stage.id} className="text-center space-y-2.5 relative">
                            {/* Connector line */}
                            {stage.id < 5 && (
                              <div className="absolute top-[18px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-[2px]">
                                <div className={`h-full transition-all duration-700 ${
                                  orderData.currentStep > stage.id ? "bg-[#00C853]" : "bg-white/10"
                                }`} />
                              </div>
                            )}

                            <div
                              className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                                isCompleted
                                  ? "bg-[#00C853] text-black shadow-[0_0_20px_rgba(0,200,83,0.35)]"
                                  : isCurrent
                                  ? "bg-[#C81E1E] text-white shadow-[0_0_20px_rgba(200,30,30,0.5)] ring-4 ring-[#C81E1E]/20"
                                  : "bg-white/8 text-white/30 border border-white/15"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={16} strokeWidth={3} />
                              ) : (
                                <StageIcon size={14} />
                              )}
                            </div>
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-wider ${
                                isCompleted || isCurrent ? "text-white" : "text-white/30"
                              }`}>
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
                </div>
              )}

              {/* ── Courier & Address Details Grid ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Courier Partner</span>
                  <p className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={14} className="text-[#00C853]" />
                    {shiprocketData?.courierName || orderData.trackingCompany}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">
                    {shiprocketData ? "AWB Number" : "Tracking Number"}
                  </span>
                  <p className="font-mono text-white/90">{shiprocketData?.awbNumber || orderData.trackingNumber}</p>
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

            {/* ══════════════════════════════════════════════════════════════
                 SHIPROCKET LIVE TRACKING TIMELINE
                 Shows only when Shiprocket data with activities is available
               ══════════════════════════════════════════════════════════════ */}
            {shiprocketData && shiprocketData.activities.length > 0 && (
              <div className="bg-white/4 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                      <Navigation size={14} className="text-sky-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                        Live Shipment Tracking
                      </h4>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                        {shiprocketData.activities.length} tracking update{shiprocketData.activities.length !== 1 ? "s" : ""} • Powered by Shiprocket
                      </p>
                    </div>
                  </div>

                  {shiprocketData.pickupDate && (
                    <div className="hidden sm:block text-right">
                      <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Picked Up</span>
                      <span className="text-[11px] text-white/70 font-mono">{formatDate(shiprocketData.pickupDate)}</span>
                    </div>
                  )}
                </div>

                {/* ── Vertical Timeline ── */}
                <div className="relative pl-8 space-y-0">
                  {/* Vertical connector line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

                  {visibleActivities.map((act, idx) => {
                    const style = getActivityStyle(act.scanType);
                    const isFirst = idx === 0;

                    return (
                      <div
                        key={idx}
                        className={`relative flex gap-4 py-3.5 ${
                          idx < visibleActivities.length - 1 ? "border-b border-white/5" : ""
                        }`}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-8 top-4 w-[10px] h-[10px] rounded-full border-2 z-10 ${
                            isFirst
                              ? `${style.bg} ${style.border} ${style.glow}`
                              : "bg-white/10 border-white/20"
                          }`}
                        >
                          {isFirst && (
                            <div className={`absolute inset-0 rounded-full ${style.bg} animate-ping`} />
                          )}
                        </div>

                        {/* Activity content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${style.bg} ${style.color} ${style.border} border`}>
                                  {act.scanTypeLabel}
                                </span>
                                {isFirst && (
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#00C853] bg-[#00C853]/10 px-1.5 py-0.5 rounded-md border border-[#00C853]/20">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed ${isFirst ? "text-white font-medium" : "text-white/70"}`}>
                                {act.activity}
                              </p>
                              {act.location && (
                                <p className="text-[10px] text-white/40 font-medium mt-1 flex items-center gap-1">
                                  <MapPin size={10} className="shrink-0" />
                                  <span>{act.location}</span>
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <p className={`text-[10px] font-mono whitespace-nowrap ${isFirst ? "text-white/70" : "text-white/40"}`}>
                                {formatDateTime(act.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show more / less toggle */}
                {shiprocketData.activities.length > INITIAL_ACTIVITY_COUNT && (
                  <button
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="w-full text-center py-3 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white bg-white/3 hover:bg-white/6 rounded-xl border border-white/5 hover:border-white/15 transition-all"
                  >
                    {showAllActivities
                      ? `▲ Show Less`
                      : `▼ Show All ${shiprocketData.activities.length} Updates`}
                  </button>
                )}
              </div>
            )}

            {/* ── Ordered Items Summary ── */}
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
