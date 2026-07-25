"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useCustomer, CustomerOrder } from "@/lib/customerContext";
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, ArrowRight, ExternalLink, ArrowLeft, RefreshCw, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePreview } from "@/lib/preview";

export default function OrdersPageContent() {
  const searchParams = useSearchParams();
  const { getPreviewPath } = usePreview();
  const { customer, orderHistory, refreshCustomerData, loading } = useCustomer();

  const selectedOrderId = searchParams?.get("orderId") || "";
  const [activeTab, setActiveTab] = useState<"all" | "processing" | "delivered">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(selectedOrderId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-expand selected order from query params
  useEffect(() => {
    if (selectedOrderId) {
      const match = orderHistory.find(
        (o) => o.orderNumber.toLowerCase() === selectedOrderId.toLowerCase() || o.id === selectedOrderId
      );
      if (match) {
        setExpandedOrderId(match.id);
      }
    } else if (orderHistory.length > 0 && !expandedOrderId) {
      setExpandedOrderId(orderHistory[0].id);
    }
  }, [selectedOrderId, orderHistory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCustomerData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Filter orders based on active tab and search query
  const filteredOrders = useMemo(() => {
    return orderHistory.filter((ord) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.items.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "processing") {
        return ord.fulfillmentStatus === "UNFULFILLED" || ord.fulfillmentStatus === "IN_TRANSIT";
      }
      if (activeTab === "delivered") {
        return ord.fulfillmentStatus === "DELIVERED" || ord.fulfillmentStatus === "FULFILLED";
      }
      return true;
    });
  }, [orderHistory, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
      case "FULFILLED":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Delivered</span>;
      case "IN_TRANSIT":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">In Transit</span>;
      default:
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Processing</span>;
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#C81E1E]/20">
      <Navbar />

      <div className="pt-36 pb-24 px-6 md:px-12 max-w-5xl mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#C81E1E]" />
              <p className="text-[10px] text-white/50 tracking-[0.3em] uppercase font-mono">Customer Account</p>
            </div>
            <h1 className="font-brand text-3xl md:text-5xl font-light text-white tracking-tight">
              Your Orders
            </h1>
            <p className="text-xs text-white/60 mt-2 max-w-lg leading-relaxed font-medium">
              Manage your purchases, inspect line items, and track live shipments for order status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#C81E1E]" : ""} />
              <span>Refresh History</span>
            </button>
            <Link
              href={getPreviewPath("/catalog")}
              className="bg-white text-black hover:bg-gray-100 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <ShoppingBag size={14} />
              <span>Shop Collection</span>
            </Link>
          </div>
        </div>

        {/* Customer Profile Banner */}
        {customer && (
          <div className="bg-gradient-to-r from-white/8 via-white/4 to-transparent border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#C81E1E]/15 border border-[#C81E1E]/40 flex items-center justify-center text-[#C81E1E] font-bold text-lg">
                {customer.firstName ? customer.firstName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {customer.firstName} {customer.lastName}
                </h3>
                <p className="text-xs font-mono text-white/60">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/70">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                <span className="text-[10px] text-white/40 block uppercase tracking-widest font-mono">Total Orders</span>
                <span className="font-bold text-white text-base">{orderHistory.length}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                <span className="text-[10px] text-white/40 block uppercase tracking-widest font-mono">Status</span>
                <span className="font-bold text-emerald-400 text-xs">Active Member</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 self-start">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "all" ? "bg-white text-black font-bold shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              All Orders ({orderHistory.length})
            </button>
            <button
              onClick={() => setActiveTab("processing")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "processing" ? "bg-white text-black font-bold shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "delivered" ? "bg-white text-black font-bold shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Delivered
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by order # or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
        </div>

        {/* Orders Listing */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white/3 border border-white/10 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-medium text-white">No Orders Found</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : "You haven't placed any orders yet. Explore our latest streetwear collections."}
            </p>
            <Link
              href={getPreviewPath("/catalog")}
              className="inline-flex items-center gap-2 bg-[#C81E1E] hover:bg-[#b01a1a] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#C81E1E]/20"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((ord: CustomerOrder) => {
              const isExpanded = expandedOrderId === ord.id;
              const formattedDate = new Date(ord.processedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={ord.id}
                  className={`bg-white/4 border transition-all duration-300 rounded-2xl overflow-hidden ${
                    isExpanded ? "border-white/25 shadow-2xl bg-white/[0.06]" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Order Summary Header */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                    className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-lg font-mono">{ord.orderNumber}</span>
                          {getStatusBadge(ord.fulfillmentStatus)}
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-0.5">Placed on {formattedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                      <div>
                        <span className="text-[10px] text-white/40 block uppercase tracking-widest font-mono">Total</span>
                        <span className="text-base font-bold text-white">₹{ord.totalPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={getPreviewPath(`/track-order?orderId=${encodeURIComponent(ord.orderNumber)}&contact=${encodeURIComponent(customer?.email || customer?.phone || "")}`)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
                        >
                          <Truck size={13} />
                          <span>Track</span>
                        </Link>
                        <button
                          className="text-white/60 hover:text-white p-2 rounded-lg transition-colors text-xs font-mono"
                        >
                          {isExpanded ? "▲ Hide" : "▼ Details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 md:p-6 bg-black/30 space-y-6">
                      {/* Line Items List */}
                      <div>
                        <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-4 font-mono">
                          Purchased Items ({ord.items.length})
                        </h4>
                        <div className="space-y-3">
                          {ord.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl border border-white/5"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                {item.image ? (
                                  <div className="relative w-14 h-16 bg-white/10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                    <Image
                                      src={item.image}
                                      alt={item.title}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-14 h-16 bg-white/10 rounded-lg flex items-center justify-center text-white/40 shrink-0">
                                    <Package size={20} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h5 className="font-semibold text-sm text-white truncate max-w-xs md:max-w-md">
                                    {item.title}
                                  </h5>
                                  <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                                    <span>Qty: {item.quantity}</span>
                                    {item.size && <span>Size: {item.size}</span>}
                                    {item.color && <span>Color: {item.color}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-sm font-bold text-white">₹{item.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address & Status Timeline Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                        {/* Shipping Address */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-white/80 font-bold text-xs uppercase tracking-wider">
                            <MapPin size={14} className="text-[#C81E1E]" />
                            <span>Delivery Address</span>
                          </div>
                          {ord.shippingAddress ? (
                            <div className="text-xs text-white/70 space-y-1 font-sans">
                              <p className="font-semibold text-white">
                                {ord.shippingAddress.firstName} {ord.shippingAddress.lastName}
                              </p>
                              <p>{ord.shippingAddress.address1 || ord.shippingAddress.address}</p>
                              <p>
                                {ord.shippingAddress.city}, {ord.shippingAddress.province || ord.shippingAddress.state} {ord.shippingAddress.zip || ord.shippingAddress.pinCode}
                              </p>
                              {ord.shippingAddress.phone && (
                                <p className="font-mono text-white/50">Phone: {ord.shippingAddress.phone}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-white/40 italic">Standard Shipping Address</p>
                          )}
                        </div>

                        {/* Payment & Order Summary */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-white/80 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span>Payment & Status</span>
                          </div>
                          <div className="text-xs space-y-1.5 pt-1">
                            <div className="flex justify-between text-white/60">
                              <span>Payment Status:</span>
                              <span className="font-bold text-emerald-400 uppercase">{ord.financialStatus}</span>
                            </div>
                            <div className="flex justify-between text-white/60">
                              <span>Fulfillment:</span>
                              <span className="font-bold text-sky-400 uppercase">{ord.fulfillmentStatus}</span>
                            </div>
                            <div className="flex justify-between text-white/80 pt-2 border-t border-white/10 font-bold">
                              <span>Amount Paid:</span>
                              <span className="font-mono text-white text-sm">₹{ord.totalPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
