"use client";

import { useCart } from "@/lib/cartContext";
import { useUI } from "@/lib/uiContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePreview } from "@/lib/preview";
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Trash2, Plus, Minus } from "lucide-react";
import Script from "next/script";

// Array containing all states and Union Territories of India
const INDIAN_STATES = [
  "Kerala", // Defaults first
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPageContent() {
  const { items, removeFromCart, updateQuantity, subtotal } = useCart();
  const { openAccountSidebar } = useUI();
  const { getPreviewPath } = usePreview();

  // Shipping Form State
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Kerala");
  const [pinCode, setPinCode] = useState("");
  const [phone, setPhone] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [billingSame, setBillingSame] = useState(true);

  // Billing Form State (for when billingSame === false)
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingApartment, setBillingApartment] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("Kerala");
  const [billingPinCode, setBillingPinCode] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  
  // Checkout Process States
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage
  const [discountError, setDiscountError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-fill saved address from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("goc_saved_address");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.emailOrPhone) setEmailOrPhone(parsed.emailOrPhone);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.apartment) setApartment(parsed.apartment);
        if (parsed.city) setCity(parsed.city);
        if (parsed.state) setState(parsed.state);
        if (parsed.pinCode) setPinCode(parsed.pinCode);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.billingSame !== undefined) setBillingSame(parsed.billingSame);
        if (parsed.billingFirstName) setBillingFirstName(parsed.billingFirstName);
        if (parsed.billingLastName) setBillingLastName(parsed.billingLastName);
        if (parsed.billingAddress) setBillingAddress(parsed.billingAddress);
        if (parsed.billingApartment) setBillingApartment(parsed.billingApartment);
        if (parsed.billingCity) setBillingCity(parsed.billingCity);
        if (parsed.billingState) setBillingState(parsed.billingState);
        if (parsed.billingPinCode) setBillingPinCode(parsed.billingPinCode);
        if (parsed.billingPhone) setBillingPhone(parsed.billingPhone);
      }
    } catch (e) {
      console.warn("Failed to load saved checkout address:", e);
    }
  }, []);

  // Discount application simulation
  const handleApplyDiscount = () => {
    setDiscountError("");
    if (discountCode.trim().toUpperCase() === "CLUB10") {
      setAppliedDiscount(10);
    } else if (discountCode.trim().toUpperCase() === "KERALA20") {
      setAppliedDiscount(20);
    } else {
      setDiscountError("Invalid discount code. Try CLUB10 or KERALA20");
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate Shipping details
    if (!emailOrPhone.trim()) errors.emailOrPhone = "Email or mobile number is required";
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!address.trim()) errors.address = "Address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!pinCode.trim()) errors.pinCode = "PIN code is required";
    if (!phone.trim()) errors.phone = "Phone number is required";

    // Validate Billing details conditionally
    if (!billingSame) {
      if (!billingFirstName.trim()) errors.billingFirstName = "Billing first name is required";
      if (!billingAddress.trim()) errors.billingAddress = "Billing address is required";
      if (!billingCity.trim()) errors.billingCity = "Billing city is required";
      if (!billingPinCode.trim()) errors.billingPinCode = "Billing PIN code is required";
      if (!billingPhone.trim()) errors.billingPhone = "Billing phone number is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0 || totalAmount <= 0) {
      alert("Your cart is empty. Please add items to your cart before proceeding to payment.");
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Check inventory stock limits for each item in cart before initializing checkout
    for (const item of items) {
      const maxStock = item.quantityAvailable ?? 999;
      if (item.quantity > maxStock) {
        setIsSubmitting(false);
        alert(`Not enough stock available for ${item.title} (${item.color ? item.color + ' / ' : ''}${item.size || ''}). You can only purchase up to ${maxStock} item${maxStock === 1 ? '' : 's'}. Please update your cart.`);
        return;
      }
    }

    setIsSubmitting(true);

    // Save address information if "Save this information for next time" is checked
    if (saveInfo) {
      try {
        localStorage.setItem("goc_saved_address", JSON.stringify({
          emailOrPhone,
          firstName,
          lastName,
          address,
          apartment,
          city,
          state,
          pinCode,
          phone,
          billingSame,
          billingFirstName,
          billingLastName,
          billingAddress,
          billingApartment,
          billingCity,
          billingState,
          billingPinCode,
          billingPhone,
        }));
      } catch (e) {
        console.warn("Failed to save address to localStorage:", e);
      }
    } else {
      localStorage.removeItem("goc_saved_address");
    }

    // Collect order details, including selected shipping/billing addresses to send to the backend order/Shopify sync logs
    const orderPayload = {
      amount: totalAmount,
      contact: emailOrPhone,
      shippingAddress: {
        firstName,
        lastName,
        address,
        apartment,
        city,
        state,
        pinCode,
        phone,
      },
      billingAddress: billingSame ? {
        firstName,
        lastName,
        address,
        apartment,
        city,
        state,
        pinCode,
        phone,
      } : {
        firstName: billingFirstName,
        lastName: billingLastName,
        address: billingAddress,
        apartment: billingApartment,
        city: billingCity,
        state: billingState,
        pinCode: billingPinCode,
        phone: billingPhone,
      }
    };

    try {
      // 1. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
      }

      // 2. Call backend API to create Razorpay Order
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to initialize payment order.");
      }

      const orderData = await res.json();

      // 3. If server does not have API keys configured
      if (orderData.mock) {
        setIsSubmitting(false);
        alert("Razorpay credentials are missing on the server. Please check environment variables.");
        return;
      }

      // 4. Open Razorpay payment gateway modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Gods Own Culture",
        description: "Streetwear Order Checkout",
        order_id: orderData.id,
        handler: function (response: any) {
          // Payment Success Callback
          setIsSubmitting(false);
          setIsSuccess(true);
        },
        prefill: {
          name: `${firstName} ${lastName}`.trim(),
          email: emailOrPhone.includes("@") ? emailOrPhone : "",
          contact: phone || (emailOrPhone.includes("@") ? "" : emailOrPhone),
        },
        theme: {
          color: "#C81E1E",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsSubmitting(false);
        alert(`Payment failed: ${response.error?.description || "Transaction declined."}`);
      });
      rzp.open();

    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      setIsSubmitting(false);
      alert(err.message || "Failed to launch Razorpay payment. Please try again.");
    }
  };

  const subTotalNum = parseFloat(subtotal) || 0;
  const discountAmount = subTotalNum * (appliedDiscount / 100);
  const totalAmount = subTotalNum - discountAmount;
  const taxes = totalAmount * 0.05; // 5% GST included

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-xl">
          <div className="flex justify-center">
            <CheckCircle2 size={64} className="text-[#00C853] animate-bounce" />
          </div>
          <h2 className="text-3xl font-brand font-light tracking-tight text-black">Order Confirmed!</h2>
          <p className="text-sm text-black/60 leading-relaxed max-w-sm mx-auto font-medium">
            Thank you for shopping with us. Your payment via Razorpay has been processed successfully. We've sent confirmation details to <strong className="text-black">{emailOrPhone}</strong>.
          </p>
          
          <div className="pt-4 border-t border-gray-100 space-y-2 text-left font-medium">
            <div className="flex justify-between text-xs text-black/40 uppercase tracking-widest">
              <span>Payment Gateway</span>
              <span className="text-[#00C853] font-bold">Razorpay Secure</span>
            </div>
            <div className="flex justify-between text-xs text-black/40 uppercase tracking-widest">
              <span>Amount Paid</span>
              <span className="text-black font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href={getPreviewPath("/catalog")}
              className="block w-full py-4 bg-black hover:bg-black/90 text-white text-xs font-bold uppercase tracking-[0.25em] rounded-xl transition-all duration-300"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black selection:bg-[#C81E1E]/10 selection:text-black">
      {/* Razorpay Client Script Loader */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* Top Header Bar — BLACK Background */}
      <header className="w-full border-b border-white/10 bg-black sticky top-0 z-40 py-5 px-6 md:px-12 flex justify-between items-center">
        <Link href={getPreviewPath("/")} className="font-sans font-bold text-lg sm:text-xl tracking-[0.2em] uppercase select-none hover:opacity-85 transition-opacity">
          <span className="text-[#C81E1E]">GODS</span> <span className="text-white">OWN</span>
        </Link>
        <Link href={getPreviewPath("/cart")} className="text-white/50 hover:text-white text-xs tracking-wider uppercase font-semibold flex items-center gap-1.5 transition-colors">
          <ArrowLeft size={13} /> Back to Cart
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-73px)]">
        
        {/* Left Column: Form Fields (White Background) */}
        <div className="lg:col-span-7 px-6 md:px-12 py-12 md:py-16 space-y-12 bg-white">
          <form onSubmit={handlePayNow} className="space-y-10">
            
            {/* Contact Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h2 className="text-base font-bold text-black uppercase tracking-wider font-sans">Contact</h2>
                <button
                  type="button"
                  onClick={openAccountSidebar}
                  className="text-xs text-black/50 hover:text-black hover:underline transition-all font-medium"
                >
                  Already have an account? Log in
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Email or mobile phone number"
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    if (validationErrors.emailOrPhone) {
                      setValidationErrors(prev => ({ ...prev, emailOrPhone: "" }));
                    }
                  }}
                  className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                    validationErrors.emailOrPhone ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                  }`}
                />
                {validationErrors.emailOrPhone && (
                  <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.emailOrPhone}</p>
                )}
              </div>
            </div>

            {/* Delivery Section */}
            <div className="space-y-5">
              <h2 className="text-base font-bold text-black uppercase tracking-wider font-sans">Delivery</h2>
              
              <div className="space-y-3.5">
                {/* Country Selection */}
                <div>
                  <label className="text-[10px] text-black/45 uppercase tracking-widest font-bold block mb-1.5 pl-1">Country/Region</label>
                  <select 
                    value="India"
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm text-black/50 outline-none cursor-not-allowed"
                  >
                    <option value="India">India</option>
                  </select>
                </div>

                {/* Names: First name (mandatory) / Last name (optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (validationErrors.firstName) {
                          setValidationErrors(prev => ({ ...prev, firstName: "" }));
                        }
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                        validationErrors.firstName ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Last name (optional)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {/* Address (Mandatory) */}
                <div>
                  <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (validationErrors.address) {
                        setValidationErrors(prev => ({ ...prev, address: "" }));
                      }
                    }}
                    className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                      validationErrors.address ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.address}</p>
                  )}
                </div>

                {/* Apartment */}
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />

                {/* City, State, PIN (All Mandatory, all States option loaded) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (validationErrors.city) {
                          setValidationErrors(prev => ({ ...prev, city: "" }));
                        }
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                        validationErrors.city ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                      }`}
                    />
                    {validationErrors.city && (
                      <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-[17px] text-sm text-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="PIN code"
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value);
                        if (validationErrors.pinCode) {
                          setValidationErrors(prev => ({ ...prev, pinCode: "" }));
                        }
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                        validationErrors.pinCode ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                      }`}
                    />
                    {validationErrors.pinCode && (
                      <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.pinCode}</p>
                    )}
                  </div>
                </div>

                {/* Phone (Mandatory) */}
                <div>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (validationErrors.phone) {
                        setValidationErrors(prev => ({ ...prev, phone: "" }));
                      }
                    }}
                    className={`w-full bg-white border rounded-xl px-4 py-4 text-sm text-black placeholder:text-black/30 outline-none transition-all ${
                      validationErrors.phone ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-[#C81E1E] mt-1.5">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Save Info */}
                <label className="flex items-center gap-3 cursor-pointer select-none py-1 pl-1">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={() => setSaveInfo(!saveInfo)}
                    className="w-4 h-4 rounded accent-black cursor-pointer"
                  />
                  <span className="text-xs text-black/60 hover:text-black transition-colors font-medium">Save this information for next time</span>
                </label>
              </div>
            </div>

            {/* Shipping Method Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-black uppercase tracking-wider font-sans">Shipping Method</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm font-bold text-black uppercase tracking-wide">Standard Delivery</p>
                  <p className="text-xs text-black/50 mt-0.5 font-medium">5 to 7 business days delivery</p>
                </div>
                <span className="text-xs font-bold text-[#00C853] uppercase tracking-wider">Free</span>
              </div>
            </div>

            {/* Payment Section (Razorpay) */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h2 className="text-base font-bold text-black uppercase tracking-wider font-sans">Payment</h2>
                <span className="text-[10px] text-black/45 flex items-center gap-1.5 uppercase tracking-widest font-bold">
                  <ShieldCheck size={14} className="text-[#00C853]" /> Secure Gateway
                </span>
              </div>
              <p className="text-xs text-black/45 pl-0.5 font-medium">All transactions are secure and encrypted.</p>

              {/* Razorpay Frame Container */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50 shadow-sm">
                
                {/* Razorpay Header Box */}
                <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      checked 
                      readOnly 
                      className="w-4 h-4 accent-black cursor-pointer" 
                    />
                    <div className="text-left">
                      <p className="text-sm font-bold text-black uppercase tracking-wide">Razorpay Secure</p>
                      <p className="text-[10px] text-black/45 mt-0.5 uppercase tracking-wider font-bold">UPI, Cards, NetBanking, Wallets</p>
                    </div>
                  </div>

                  {/* Payment Icons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-gray-50 border border-gray-200 text-black/50 px-1.5 py-0.5 rounded font-bold">UPI</span>
                    <span className="text-[9px] bg-gray-50 border border-gray-200 text-black/50 px-1.5 py-0.5 rounded font-bold">VISA</span>
                    <span className="text-[9px] bg-gray-50 border border-gray-200 text-black/50 px-1.5 py-0.5 rounded font-bold">MC</span>
                    <span className="text-[9px] bg-gray-50 border border-gray-200 text-black/40 px-1 py-0.5 rounded text-center font-bold font-sans">+15</span>
                  </div>
                </div>

                {/* Redirect details inside Razorpay panel */}
                <div className="p-5 bg-gray-50/30 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                    <CreditCard size={20} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-black/50 leading-relaxed max-w-sm mx-auto font-medium">
                    You'll be redirected to Razorpay Secure (UPI, Cards, Int'l Cards, Wallets) to complete your purchase safely.
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-black uppercase tracking-wider font-sans">Billing Address</h2>
              
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {/* Same billing as shipping */}
                <label className="flex items-center gap-3 p-5 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="billing_address"
                    checked={billingSame}
                    onChange={() => setBillingSame(true)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-xs text-black/80 font-medium">Same as shipping address</span>
                </label>

                {/* Different billing address */}
                <label className="flex items-center gap-3 p-5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="billing_address"
                    checked={!billingSame}
                    onChange={() => setBillingSame(false)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-xs text-black/80 font-medium">Use a different billing address</span>
                </label>
              </div>

              {/* Conditionally rendered Billing Address Sub-Form */}
              {!billingSame && (
                <div className="p-5 border border-gray-200 bg-gray-50/50 rounded-2xl space-y-3.5 mt-3 animate-fade-in shadow-inner">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider pl-0.5">Billing Details</h3>
                  
                  {/* Billing Country */}
                  <div>
                    <label className="text-[9px] text-black/45 uppercase tracking-widest font-bold block mb-1 pl-1">Country/Region</label>
                    <select 
                      value="India"
                      disabled
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-black/50 outline-none cursor-not-allowed font-medium"
                    >
                      <option value="India">India</option>
                    </select>
                  </div>

                  {/* Billing Names (First name mandatory, last name optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="First name"
                        value={billingFirstName}
                        onChange={(e) => {
                          setBillingFirstName(e.target.value);
                          if (validationErrors.billingFirstName) {
                            setValidationErrors(prev => ({ ...prev, billingFirstName: "" }));
                          }
                        }}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none transition-all ${
                          validationErrors.billingFirstName ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                        }`}
                      />
                      {validationErrors.billingFirstName && (
                        <p className="text-[10px] text-[#C81E1E] mt-1 pl-1 font-bold">{validationErrors.billingFirstName}</p>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Last name (optional)"
                      value={billingLastName}
                      onChange={(e) => setBillingLastName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>

                  {/* Billing Address */}
                  <div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={billingAddress}
                      onChange={(e) => {
                        setBillingAddress(e.target.value);
                        if (validationErrors.billingAddress) {
                          setValidationErrors(prev => ({ ...prev, billingAddress: "" }));
                        }
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none transition-all ${
                        validationErrors.billingAddress ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                      }`}
                    />
                    {validationErrors.billingAddress && (
                      <p className="text-[10px] text-[#C81E1E] mt-1 pl-1 font-bold">{validationErrors.billingAddress}</p>
                    )}
                  </div>

                  {/* Billing Apartment */}
                  <input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={billingApartment}
                    onChange={(e) => setBillingApartment(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />

                  {/* Billing City, State, PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={billingCity}
                        onChange={(e) => {
                          setBillingCity(e.target.value);
                          if (validationErrors.billingCity) {
                            setValidationErrors(prev => ({ ...prev, billingCity: "" }));
                          }
                        }}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none transition-all ${
                          validationErrors.billingCity ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                        }`}
                      />
                      {validationErrors.billingCity && (
                        <p className="text-[10px] text-[#C81E1E] mt-1 pl-1 font-bold">{validationErrors.billingCity}</p>
                      )}
                    </div>

                    <div>
                      <select
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="PIN code"
                        value={billingPinCode}
                        onChange={(e) => {
                          setBillingPinCode(e.target.value);
                          if (validationErrors.billingPinCode) {
                            setValidationErrors(prev => ({ ...prev, billingPinCode: "" }));
                          }
                        }}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none transition-all ${
                          validationErrors.billingPinCode ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                        }`}
                      />
                      {validationErrors.billingPinCode && (
                        <p className="text-[10px] text-[#C81E1E] mt-1 pl-1 font-bold">{validationErrors.billingPinCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Billing Phone */}
                  <div>
                    <input
                      type="text"
                      placeholder="Phone"
                      value={billingPhone}
                      onChange={(e) => {
                        setBillingPhone(e.target.value);
                        if (validationErrors.billingPhone) {
                          setValidationErrors(prev => ({ ...prev, billingPhone: "" }));
                        }
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-3.5 text-xs text-black placeholder:text-black/30 outline-none transition-all ${
                        validationErrors.billingPhone ? "border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]" : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                      }`}
                    />
                    {validationErrors.billingPhone && (
                      <p className="text-[10px] text-[#C81E1E] mt-1 pl-1 font-bold">{validationErrors.billingPhone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pay Now Section with Dark Canvas to make the button's glowing effects identical */}
            <div className="bg-black border border-white/10 rounded-2xl p-6 text-center space-y-4 shadow-xl relative overflow-hidden mt-8">
              {/* Ambient background glow inside the card */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#C81E1E]/10 rounded-full blur-2xl pointer-events-none" />
              
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold relative z-10">
                Confirm your details above and click below to pay
              </p>

              <div className="relative group">
                {/* Running red light on border — conic gradient rotates endlessly */}
                <div
                  className="absolute -inset-[1.5px] rounded-xl transition-opacity duration-500 opacity-100"
                  style={{
                    background: 'conic-gradient(from var(--angle, 0deg), transparent 60%, #ef4444 75%, #ff6b6b 80%, transparent 90%)',
                    animation: 'spin-border 2.4s linear infinite',
                    borderRadius: '0.75rem',
                  }}
                />

                {/* Glass button body */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0 || totalAmount <= 0}
                  className={`relative w-full py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-500 overflow-hidden backdrop-blur-2xl ${
                    items.length === 0 || totalAmount <= 0
                      ? 'bg-white/4 border border-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-white/8 border border-white/15 text-white cursor-pointer hover:bg-white/12 hover:border-white/25'
                  }`}
                  style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Glass inner highlight streak */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
                    }}
                  />

                  {/* Red ambient glow beneath text */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl opacity-30"
                    style={{ background: 'rgba(239,68,68,0.6)' }} />

                  <div className="flex items-center justify-center gap-4 w-full relative z-10">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold uppercase tracking-[0.4em] text-white">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold uppercase tracking-[0.4em] text-white drop-shadow-sm">
                          {items.length === 0 ? "Cart is Empty" : "Pay Now"}
                        </span>
                        {items.length > 0 && (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        )}
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

          </form>

          {/* Footer Policy Links */}
          <footer className="pt-10 border-t border-gray-200 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-widest text-black/40 font-semibold">
            <Link href={getPreviewPath("/refund-policy")} className="hover:text-black transition-colors">Refund policy</Link>
            <Link href={getPreviewPath("/shipping-policy")} className="hover:text-black transition-colors">Shipping policy</Link>
            <Link href={getPreviewPath("/terms-of-service")} className="hover:text-black transition-colors">Privacy policy</Link>
            <Link href={getPreviewPath("/terms-of-service")} className="hover:text-black transition-colors">Terms of service</Link>
          </footer>
        </div>

        {/* Right Column: Checkout Cart Summary (Light Grey Background) */}
        <div className="lg:col-span-5 bg-gray-50 border-l border-gray-200 px-6 md:px-12 py-12 md:py-16 space-y-8 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] overflow-y-auto">
          
          {/* Cart items list */}
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-xs text-black/35 text-center py-6 font-medium">No items in cart</p>
            ) : (
              items.map((item, idx) => (
                <div key={`${item.variantId}-${idx}`} className="flex items-center gap-4 py-3 border-b border-gray-200/60 last:border-b-0">
                  
                  {/* Image with Quantity Badge */}
                  <div className="relative w-16 h-20 bg-white border border-gray-200 rounded-xl flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover rounded-xl"
                    />
                    {/* Badge */}
                    <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white/5 shadow-md">
                      {item.quantity}
                    </span>
                  </div>

                  {/* Details & Interactive Quantity Controls */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider truncate pl-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-black/50 uppercase tracking-widest pl-0.5 font-bold">
                      Size: {item.size} / Color: {item.color}
                    </p>

                    {/* Quantity Edit & Remove Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-1 text-black/60 hover:text-black hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-2.5 py-1 text-black text-[11px] font-bold border-x border-gray-200 font-sans">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= (item.quantityAvailable ?? 999)}
                          className={`px-2 py-1 transition-colors ${
                            item.quantity >= (item.quantityAvailable ?? 999)
                              ? "text-black/20 cursor-not-allowed bg-gray-50"
                              : "text-black/60 hover:text-black hover:bg-gray-100"
                          }`}
                          aria-label="Increase quantity"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-black/30 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                        title="Remove item from checkout"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Price Calculation for Line Item */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-black font-sans block">
                      ₹{(parseFloat(item.price || "0") * item.quantity).toLocaleString("en-IN")}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[9px] text-black/40 font-medium font-sans block mt-0.5">
                        ₹{parseFloat(item.price || "0").toLocaleString("en-IN")} each
                      </span>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Promo code box */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-black uppercase tracking-widest placeholder:text-black/30 outline-none focus:border-black transition-all font-medium"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="bg-black/5 hover:bg-black/10 border border-gray-300 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all"
              >
                Apply
              </button>
            </div>
            {discountError && <p className="text-xs text-[#C81E1E] pl-1 font-medium">{discountError}</p>}
            {appliedDiscount > 0 && <p className="text-xs text-[#00C853] pl-1 font-bold">✓ Coupon Applied: {appliedDiscount}% Discount!</p>}
          </div>

          <hr className="border-gray-200" />

          {/* Checkout Totals details */}
          <div className="space-y-4 font-medium">
            <div className="flex justify-between text-xs text-black/50 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-black/80 font-bold font-sans">₹{subTotalNum.toLocaleString("en-IN")}</span>
            </div>
            
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-xs text-[#00C853] uppercase tracking-widest font-bold">
                <span>Discount ({appliedDiscount}%)</span>
                <span className="font-sans">-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-black/50 uppercase tracking-widest">
              <span>Shipping</span>
              <span className="text-[#00C853] font-bold text-right">Free</span>
            </div>

            <hr className="border-gray-200 pt-2" />

            <div className="flex justify-between items-baseline text-black">
              <span className="text-sm font-bold uppercase tracking-wider">Total</span>
              <div className="text-right">
                <span className="text-2xl font-black font-sans leading-none">₹{totalAmount.toLocaleString("en-IN")}</span>
                <p className="text-[9px] text-black/40 uppercase tracking-widest font-bold mt-1">
                  Including ₹{taxes.toLocaleString("en-IN")} in taxes
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CSS custom variables and keyframes for border glowing sweep */}
      <style dangerouslySetInnerHTML={{ __html: `
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to { --angle: 360deg; }
        }
      ` }} />
    </main>
  );
}
