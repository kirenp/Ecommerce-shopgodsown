"use client";

import { useUI } from "@/lib/uiContext";
import { useCustomer } from "@/lib/customerContext";
import { useRecentlyViewed } from "@/lib/recentlyViewedContext";
import { useWishlist } from "@/lib/wishlistContext";
import { useCart } from "@/lib/cartContext";
import { X, Truck, Search, User, Package, MapPin, Heart, LogOut, Plus, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePreview } from "@/lib/preview";

export default function AccountSidebar() {
  const { isAccountSidebarOpen, openAccountSidebar, closeAccountSidebar } = useUI();
  const { customer, isLoggedIn, checkEmail, signUp, initiateAuth, logout, savedAddresses, orderHistory, addAddress, removeAddress } = useCustomer();
  // Sign In View Toggle State
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Auth Form State — email only
  const [loginEmail, setLoginEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-open sidebar when auth callback succeeds
  useEffect(() => {
    const handleAuthSuccess = () => {
      openAccountSidebar();
    };
    window.addEventListener("goc_auth_success", handleAuthSuccess);
    return () => window.removeEventListener("goc_auth_success", handleAuthSuccess);
  }, [openAccountSidebar]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!loginEmail.trim()) {
      setAuthError("Email address is required.");
      return;
    }

    if (!EMAIL_REGEX.test(loginEmail.trim())) {
      setAuthError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    setIsSubmitting(true);
    try {
      const emailToSubmit = loginEmail.trim().toLowerCase();

      // Step 1: Check if email exists in Shopify
      const emailCheck = await checkEmail(emailToSubmit);
      if (emailCheck.error) {
        setAuthError(emailCheck.error);
        return;
      }

      // Step 2: Handle based on mode
      if (authMode === "signup") {
        if (emailCheck.exists) {
          setAuthError("An account with this email already exists. Please Sign In instead.");
          return;
        }
        // Create customer in Shopify
        const createResult = await signUp(emailToSubmit);
        if (!createResult.success) {
          setAuthError(createResult.error || "Failed to create account.");
          return;
        }
      } else {
        // Sign In: customer must exist
        if (!emailCheck.exists) {
          setAuthError("No account found with this email. Please Sign Up first.");
          return;
        }
      }

      // Step 3: Initiate Shopify OAuth with login_hint → redirects to OTP page for target email
      const authResult = await initiateAuth(emailToSubmit);
      if (authResult.error) {
        setAuthError(authResult.error);
        return;
      }
      if (authResult.authorizationUrl) {
        // Redirect to Shopify's hosted OTP verification page
        window.location.href = authResult.authorizationUrl;
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const { items: recentlyViewedItems } = useRecentlyViewed();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { getPreviewPath } = usePreview();

  // Active Tab State for Logged-In Customer
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "wishlist">("profile");

  // New Address Form State
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newAddrStr, setNewAddrStr] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("Kerala");
  const [newPin, setNewPin] = useState("");
  const [newPhone, setNewPhone] = useState("");

  if (!isAccountSidebarOpen) return null;

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newAddrStr || !newCity || !newPin || !newPhone) return;

    addAddress({
      firstName: newFirstName,
      lastName: newLastName,
      address: newAddrStr,
      city: newCity,
      state: newState,
      pinCode: newPin,
      phone: newPhone,
    });

    setShowAddAddr(false);
    setNewFirstName("");
    setNewLastName("");
    setNewAddrStr("");
    setNewCity("");
    setNewPin("");
    setNewPhone("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 backdrop-blur-sm"
        onClick={closeAccountSidebar}
      />

      {/* Drawer Container */}
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-[-10px_0_40px_rgba(0,0,0,0.25)] flex flex-col transform transition-transform duration-300 translate-x-0 animate-slide-in-right"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <h2 className="text-black font-black uppercase tracking-[0.15em] text-sm font-sans">
            {isLoggedIn ? `Account Dashboard` : `Sign In`}
          </h2>
          <button 
            onClick={closeAccountSidebar} 
            className="p-2 text-black/50 hover:text-black hover:bg-gray-100 transition-colors rounded-full"
            aria-label="Close Account Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/40">

          {/* ========================================================================= */}
          {/* SECTION 1: GUEST VIEW (SIGN IN / SIGN UP) OR SIGNED IN DASHBOARD */}
          {/* ========================================================================= */}
          {!isLoggedIn ? (
            !showLoginForm ? (
              /* State A: Action Buttons UI First */
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-black uppercase tracking-[0.12em] font-sans">
                    Sign In To Your Account
                  </h3>
                  <p className="text-xs text-black/50 tracking-wide font-medium">
                    Passwordless authentication & Shop account integration
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Black Button: Click to open Sign In / Sign Up Form */}
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="w-full bg-[#111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Sign In or Sign Up
                  </button>

                  {/* Purple Button: Sign In with Shop */}
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="w-full bg-[#5a31f4] hover:bg-[#4820dc] text-white text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(90,49,244,0.18)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <span>Sign In With</span>
                    <span className="font-sans font-black tracking-normal lowercase text-[15px] italic">shop</span>
                  </button>
                </div>

                {/* Privacy text */}
                <p className="text-[10px] text-center text-black/40 leading-relaxed font-medium px-4">
                  By signing in, you agree to our{" "}
                  <Link 
                    href={getPreviewPath("/terms-of-service")} 
                    onClick={closeAccountSidebar}
                    className="text-black/60 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link 
                    href={getPreviewPath("/terms-of-service")} 
                    onClick={closeAccountSidebar}
                    className="text-black/60 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </p>
              </div>
            ) : (
              /* State B: Revealed Sign In / Create Account Form */
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setShowLoginForm(false); setAuthError(""); }}
                  className="text-xs font-bold text-black/60 hover:text-black flex items-center gap-1 uppercase tracking-wider transition-colors"
                >
                  ← Back to Options
                </button>

                {/* Auth Mode Toggle Tabs */}
                <div className="grid grid-cols-2 gap-1 bg-gray-200/70 p-1 rounded-xl text-center">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signin"); setAuthError(""); }}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      authMode === "signin" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      authMode === "signup" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Banner */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-black uppercase tracking-[0.12em] font-sans">
                    {authMode === "signup" ? "Create Account" : "Sign In To Account"}
                  </h3>
                  <p className="text-xs text-black/50 tracking-wide font-medium">
                    {authMode === "signup"
                      ? "Enter your email to create a new account"
                      : "Enter your email to receive a verification code"}
                  </p>
                </div>

                {/* Email-Only Auth Form */}
                <form onSubmit={handleCustomerSubmit} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 font-medium">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-bold text-black/60 uppercase tracking-wider block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-black placeholder:text-black/30 outline-none focus:border-black transition-all font-mono"
                    />
                  </div>

                  {/* OTP Info */}
                  <p className="text-[10px] text-black/40 leading-relaxed">
                    📧 A 6-digit verification code will be sent to your email by Shopify
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#111] hover:bg-black disabled:bg-black/50 text-white text-xs font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to Shopify...</span>
                      </>
                    ) : (
                      <span>{authMode === "signup" ? "Create Account & Verify" : "Continue with Email"}</span>
                    )}
                  </button>
                </form>

                {/* Privacy text */}
                <p className="text-[10px] text-center text-black/40 leading-relaxed font-medium px-4">
                  By signing in, you agree to our{" "}
                  <Link 
                    href={getPreviewPath("/terms-of-service")} 
                    onClick={closeAccountSidebar}
                    className="text-black/60 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link 
                    href={getPreviewPath("/terms-of-service")} 
                    onClick={closeAccountSidebar}
                    className="text-black/60 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </p>
              </div>
            )
          ) : (
            /* ========================================================================= */
            /* SIGNED IN CUSTOMER DASHBOARD (PROFILE, ORDERS, ADDRESSES, WISHLIST) */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Customer Profile Greeting Header */}
              <div className="bg-black text-white rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-[#00C853] font-bold uppercase tracking-widest bg-[#00C853]/10 px-2 py-0.5 rounded-full border border-[#00C853]/20">
                      {customer?.tier || "Club Member"}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-1.5 font-sans">
                      {customer?.firstName} {customer?.lastName}
                    </h3>
                    <p className="text-xs text-white/50 font-mono">{customer?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>

              {/* 4 Dashboard Navigation Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-gray-200/70 p-1 rounded-xl text-center">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "profile" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "orders" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "addresses" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  }`}
                >
                  Addresses
                </button>
                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "wishlist" ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  }`}
                >
                  Wishlist ({wishlistItems.length})
                </button>
              </div>

              {/* TAB 1: MY PROFILE */}
              {activeTab === "profile" && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                  <h4 className="font-bold text-black uppercase tracking-wider text-[11px] font-sans border-b border-gray-100 pb-2">
                    Account Details
                  </h4>
                  <div className="space-y-2.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-black/40 uppercase tracking-widest text-[10px]">Name</span>
                      <span className="text-black font-bold">{customer?.firstName} {customer?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/40 uppercase tracking-widest text-[10px]">Email</span>
                      <span className="text-black font-mono">{customer?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/40 uppercase tracking-widest text-[10px]">Phone</span>
                      <span className="text-black font-mono">{customer?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/40 uppercase tracking-widest text-[10px]">Marketing Consent</span>
                      <span className="text-[#00C853] font-bold">Subscribed</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {orderHistory.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-8 text-center text-black/40 text-xs">
                      No order history found.
                    </div>
                  ) : (
                    orderHistory.map((ord) => (
                      <div key={ord.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-black">{ord.orderNumber}</span>
                            <span className="text-[10px] text-black/40 block font-mono">{new Date(ord.processedAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#00C853] uppercase bg-[#00C853]/10 px-2 py-0.5 rounded-full">
                            {ord.fulfillmentStatus}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 border-t border-gray-100 pt-2">
                          {ord.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px]">
                              <span className="font-medium text-black/80 truncate max-w-[200px]">{item.title}</span>
                              <span className="font-mono text-black font-bold">₹{item.price}</span>
                            </div>
                          ))}
                        </div>

                        {/* One-Click Track Button */}
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-black font-sans">Total: ₹{ord.totalPrice}</span>
                          <Link
                            href={getPreviewPath(`/track-order?orderId=${encodeURIComponent(ord.orderNumber)}&contact=${encodeURIComponent(customer?.phone || "")}`)}
                            onClick={closeAccountSidebar}
                            className="bg-black hover:bg-black/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <span>Track Package</span>
                            <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: SAVED ADDRESSES */}
              {activeTab === "addresses" && (
                <div className="space-y-3 text-xs">
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 relative shadow-xs">
                      {addr.isDefault && (
                        <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          Default Shipping
                        </span>
                      )}
                      <p className="font-bold text-black">{addr.firstName} {addr.lastName}</p>
                      <p className="text-black/60 leading-relaxed font-medium">{addr.address}, {addr.city}, {addr.state} - {addr.pinCode}</p>
                      <p className="text-black/50 font-mono text-[11px]">Phone: {addr.phone}</p>
                      <button
                        onClick={() => removeAddress(addr.id)}
                        className="text-[10px] text-red-500 hover:underline font-bold uppercase pt-1 block"
                      >
                        Remove Address
                      </button>
                    </div>
                  ))}

                  {!showAddAddr ? (
                    <button
                      onClick={() => setShowAddAddr(true)}
                      className="w-full border border-dashed border-gray-300 hover:border-black text-black py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-colors bg-white"
                    >
                      <Plus size={14} />
                      <span>Add New Address</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveNewAddress} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h5 className="font-bold text-black uppercase tracking-wider text-[10px]">New Address</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newFirstName}
                          onChange={(e) => setNewFirstName(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newLastName}
                          onChange={(e) => setNewLastName(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={newAddrStr}
                        onChange={(e) => setNewAddrStr(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="PIN Code"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        required
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg"
                        >
                          Save Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddAddr(false)}
                          className="px-3 border border-gray-200 text-black text-[10px] font-bold uppercase rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 4: WISHLIST */}
              {activeTab === "wishlist" && (
                <div className="space-y-3">
                  {wishlistItems.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-8 text-center text-black/40 text-xs font-medium">
                      Your wishlist is empty.
                    </div>
                  ) : (
                    wishlistItems.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-xs">
                        <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-black uppercase tracking-wider truncate">{item.title}</h5>
                          <span className="text-xs font-bold text-black font-sans block mt-0.5">₹{parseFloat(item.price).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              addToCart({
                                id: item.id,
                                variantId: item.id,
                                handle: item.handle,
                                title: item.title,
                                image: item.image,
                                color: item.color || "",
                                size: item.size || "",
                                price: item.price,
                                currencyCode: item.currencyCode || "INR"
                              });
                            }}
                            className="bg-black text-[#fff] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-1.5 text-black/30 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}

          <hr className="border-gray-200/60" />

          {/* ========================================================================= */}
          {/* SECTION 2: TRACK YOUR ORDER (PAGE NAVIGATION BUTTON ONLY) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C81E1E]/10 flex items-center justify-center text-[#C81E1E] flex-shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black uppercase tracking-wider font-sans">
                  Track Your Order
                </h4>
                <p className="text-[10px] text-black/50 tracking-wide font-medium">
                  Live shipment & courier tracking
                </p>
              </div>
            </div>
            <Link
              href={getPreviewPath("/track-order")}
              onClick={closeAccountSidebar}
              className="bg-black hover:bg-black/90 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            >
              <span>Track Page</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <hr className="border-gray-200/60" />

          {/* ========================================================================= */}
          {/* SECTION 4: RECENTLY VIEWED PRODUCTS (LIVE CARDS FROM LOCAL STORAGE) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-black uppercase tracking-[0.18em] font-sans">
              Recently Viewed ({recentlyViewedItems.length})
            </h4>

            {recentlyViewedItems.length === 0 ? (
              <div className="w-full border border-dashed border-gray-200 rounded-2xl py-10 px-6 text-center bg-white shadow-xs">
                <p className="text-xs text-black/35 font-medium tracking-wide">
                  No recently viewed products
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentlyViewedItems.map((prod) => (
                  <Link
                    key={prod.id}
                    href={getPreviewPath(`/products/${prod.handle}`)}
                    onClick={closeAccountSidebar}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col"
                  >
                    <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                      <Image
                        src={prod.image}
                        alt={prod.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-2.5 space-y-1">
                      <h5 className="text-[11px] font-bold text-black uppercase tracking-wider truncate font-sans">
                        {prod.title}
                      </h5>
                      <span className="text-[11px] font-bold text-black font-sans block">
                        ₹{parseFloat(prod.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
