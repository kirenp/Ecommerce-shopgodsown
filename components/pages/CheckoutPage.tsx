"use client";

import { useCart } from "@/lib/cartContext";
import { useUI } from "@/lib/uiContext";
import { useCustomer } from "@/lib/customerContext";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const { openAccountSidebar } = useUI();
  const { customer, isLoggedIn, savedAddresses, refreshCustomerData } = useCustomer();
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
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState("");
  const [finalPaidAmount, setFinalPaidAmount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Receipt Printer States
  const [isPrinting, setIsPrinting] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [hoveredPreview, setHoveredPreview] = useState<{
    image: string;
    title: string;
    variant?: string;
    x: number;
    y: number;
  } | null>(null);
  const hasAutoPrinted = useRef(false);

  // Auto-print receipt on first mount
  useEffect(() => {
    if (!hasAutoPrinted.current && items.length > 0) {
      hasAutoPrinted.current = true;
      const timer = setTimeout(() => {
        triggerPrint();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  const triggerPrint = useCallback(() => {
    if (isPrinting) return;
    setReceiptVisible(false);
    setIsPrinting(true);
    // After the print animation finishes (~1.5s), mark receipt as fully visible
    setTimeout(() => {
      setReceiptVisible(true);
      setIsPrinting(false);
    }, 1800);
  }, [isPrinting]);

  // Pre-fill logged in customer email & default saved address
  useEffect(() => {
    if (isLoggedIn && customer) {
      if (customer.email && !emailOrPhone) {
        setEmailOrPhone(customer.email);
      }
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      if (defaultAddr) {
        if (!firstName && defaultAddr.firstName) setFirstName(defaultAddr.firstName);
        if (!lastName && defaultAddr.lastName) setLastName(defaultAddr.lastName);
        if (!address && defaultAddr.address) setAddress(defaultAddr.address);
        if (!city && defaultAddr.city) setCity(defaultAddr.city);
        if (!state && defaultAddr.state) setState(defaultAddr.state);
        if (!pinCode && defaultAddr.pinCode) setPinCode(defaultAddr.pinCode);
        if (!phone && defaultAddr.phone) setPhone(defaultAddr.phone);
      } else if (customer.firstName) {
        if (!firstName) setFirstName(customer.firstName);
        if (!lastName && customer.lastName) setLastName(customer.lastName);
        if (!phone && customer.phone) setPhone(customer.phone);
      }
    }
  }, [isLoggedIn, customer, savedAddresses]);

  // Auto-fill saved address from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("goc_saved_address");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.emailOrPhone && !emailOrPhone) setEmailOrPhone(parsed.emailOrPhone);
        if (parsed.firstName && !firstName) setFirstName(parsed.firstName);
        if (parsed.lastName && !lastName) setLastName(parsed.lastName);
        if (parsed.address && !address) setAddress(parsed.address);
        if (parsed.apartment && !apartment) setApartment(parsed.apartment);
        if (parsed.city && !city) setCity(parsed.city);
        if (parsed.state && !state) setState(parsed.state);
        if (parsed.pinCode && !pinCode) setPinCode(parsed.pinCode);
        if (parsed.phone && !phone) setPhone(parsed.phone);
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
    if (!pinCode.trim()) {
      errors.pinCode = "PIN code is required";
    } else if (pinCode.trim().length !== 6) {
      errors.pinCode = "PIN code must be 6 digits";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (phone.trim().length !== 10) {
      errors.phone = "Phone number must be 10 digits";
    }

    // Validate Billing details conditionally
    if (!billingSame) {
      if (!billingFirstName.trim()) errors.billingFirstName = "Billing first name is required";
      if (!billingAddress.trim()) errors.billingAddress = "Billing address is required";
      if (!billingCity.trim()) errors.billingCity = "Billing city is required";
      if (!billingPinCode.trim()) {
        errors.billingPinCode = "Billing PIN code is required";
      } else if (billingPinCode.trim().length !== 6) {
        errors.billingPinCode = "Billing PIN code must be 6 digits";
      }
      if (!billingPhone.trim()) {
        errors.billingPhone = "Billing phone number is required";
      } else if (billingPhone.trim().length !== 10) {
        errors.billingPhone = "Billing phone number must be 10 digits";
      }
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
      items: items.map(item => ({
        id: item.id,
        variantId: item.variantId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        image: item.image,
      })),
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
        handler: async function (response: any) {
          // Payment Success Callback
          setFinalPaidAmount(totalAmount);
          try {
            const completeRes = await fetch("/api/checkout/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...orderPayload,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const completeData = await completeRes.json();
            if (completeData.orderNumber) {
              setConfirmedOrderNumber(completeData.orderNumber);
            }
            const userEmail = emailOrPhone.includes("@") ? emailOrPhone.trim().toLowerCase() : (customer?.email || "");
            if (userEmail) {
              refreshCustomerData(userEmail);
            }
          } catch (err) {
            console.error("Order complete sync error:", err);
          } finally {
            clearCart();
            setIsSubmitting(false);
            setIsSuccess(true);
          }
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
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="max-w-[380px] w-full">

          {/* ── PRINTER MACHINE (Order Complete) ── */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/8 p-5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            
            {/* Machine Top Row */}
            <div className="flex justify-between items-center mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.9" />
                  <path d="M2 17l10 5 10-5" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12l10 5 10-5" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <Link
                href={getPreviewPath("/")}
                className="flex items-center gap-1.5 bg-[#00C853]/15 hover:bg-[#00C853]/25 text-[#00C853] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                Home
              </Link>
            </div>

            {/* Order Summary in Machine */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white">Order Placed!</h3>
                  <p className="text-[10px] text-white/40 mt-0.5 font-medium">Thank you for shopping with us</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Total</p>
                  <p className="text-lg font-black text-white font-sans leading-tight">
                    ₹{(finalPaidAmount || totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 size={14} className="text-[#00C853]" />
                <span className="text-[10px] text-[#00C853] font-bold uppercase tracking-wider">Order complete</span>
              </div>
            </div>

            <div className="mt-4 mx-auto w-[90%] h-[3px] bg-black/60 rounded-full shadow-inner" />
          </div>

          {/* ── RECEIPT PAPER ── */}
          <div className="relative">
            <div className="absolute left-3 right-3 top-0 bottom-2 bg-black/20 rounded-b-lg blur-md -z-10" />
            <div className="receipt-tear-edge" />

            <div className="bg-[#fafaf5] px-6 pb-6 pt-2 shadow-lg receipt-paper-body" style={{ animation: 'receiptSlideDown 0.8s ease-out forwards' }}>
              {/* Brand Mark */}
              <div className="flex justify-center pt-2 pb-4">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-md">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.95" />
                    <path d="M2 17l10 5 10-5" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12l10 5 10-5" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Confirmation Text */}
              <div className="text-center mb-4" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <p className="text-xs font-bold text-black uppercase tracking-wider">GODS OWN CULTURE</p>
                <p className="text-[9px] text-black/40 mt-1">Your order has been confirmed</p>
              </div>

              <div className="receipt-dashed-line" />

              {/* Order Details */}
              <div className="py-3 space-y-2" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                {confirmedOrderNumber && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-black/50">Order</span>
                    <span className="font-bold text-[#C81E1E]">{confirmedOrderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-black/50">
                  <span>Sent to</span>
                  <span className="text-black font-bold truncate ml-4 max-w-[180px]">{emailOrPhone}</span>
                </div>
              </div>

              <div className="receipt-dashed-line" />

              {/* Total */}
              <div className="py-4 flex justify-between items-center" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <span className="text-xs font-bold text-black uppercase tracking-wider">TOTAL PAID</span>
                <span className="text-2xl font-black text-black tabular-nums">₹{(finalPaidAmount || totalAmount).toLocaleString("en-IN")}</span>
              </div>

              <div className="receipt-dashed-line" />

              {/* Payment Meta */}
              <div className="pt-3 pb-4 space-y-1.5" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="flex justify-between text-[9px] text-black/35">
                  <span>Payment</span>
                  <span className="text-[#00C853] font-bold">Razorpay Secure ✓</span>
                </div>
                <div className="flex justify-between text-[9px] text-black/35">
                  <span>Date</span>
                  <span suppressHydrationWarning>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Barcode */}
              <div className="flex flex-col items-center pt-2 pb-1">
                <div className="receipt-barcode" />
                <p className="text-[8px] text-black/25 mt-1.5 tracking-[0.3em] uppercase" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                  <span suppressHydrationWarning>GOC {confirmedOrderNumber || Math.random().toString(36).substring(2, 6).toUpperCase()}</span>
                </p>
              </div>

              {/* Continue Shopping */}
              <div className="pt-4">
                <Link
                  href={getPreviewPath("/catalog")}
                  className="block w-full py-3.5 bg-black hover:bg-black/90 text-white text-[10px] font-bold uppercase tracking-[0.25em] rounded-lg transition-all text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Receipt Printer CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes receiptSlideDown {
            0% { opacity: 0; transform: translateY(-40px); max-height: 0; }
            30% { opacity: 1; }
            100% { transform: translateY(0); max-height: 2000px; }
          }
          .receipt-tear-edge {
            height: 12px;
            background: #fafaf5;
            clip-path: polygon(
              0% 100%,
              2% 60%, 4% 100%, 6% 55%, 8% 100%, 10% 65%, 12% 100%, 14% 50%,
              16% 100%, 18% 70%, 20% 100%, 22% 55%, 24% 100%, 26% 60%, 28% 100%,
              30% 50%, 32% 100%, 34% 65%, 36% 100%, 38% 55%, 40% 100%, 42% 70%,
              44% 100%, 46% 50%, 48% 100%, 50% 60%, 52% 100%, 54% 55%, 56% 100%,
              58% 65%, 60% 100%, 62% 50%, 64% 100%, 66% 70%, 68% 100%, 70% 55%,
              72% 100%, 74% 60%, 76% 100%, 78% 50%, 80% 100%, 82% 65%, 84% 100%,
              86% 55%, 88% 100%, 90% 70%, 92% 100%, 94% 50%, 96% 100%, 98% 60%,
              100% 100%
            );
            position: relative; z-index: 1; margin-top: -1px;
          }
          .receipt-dashed-line { border: none; border-top: 1.5px dashed rgba(0,0,0,0.15); margin: 0; }
          .receipt-barcode {
            width: 140px; height: 32px;
            background: repeating-linear-gradient(90deg, #000 0px, #000 1.5px, transparent 1.5px, transparent 3px, #000 3px, #000 4px, transparent 4px, transparent 7px, #000 7px, #000 8.5px, transparent 8.5px, transparent 10px, #000 10px, #000 11px, transparent 11px, transparent 14px, #000 14px, #000 16px, transparent 16px, transparent 18px, #000 18px, #000 19px, transparent 19px, transparent 21px);
            opacity: 0.7; border-radius: 1px;
          }
          .receipt-paper-body {
            background-image: linear-gradient(180deg, rgba(0,0,0,0.01) 0%, transparent 3%), linear-gradient(0deg, rgba(0,0,0,0.02) 0%, transparent 5%);
            border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;
          }
        ` }} />
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="PIN code"
                      value={pinCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPinCode(val);
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
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
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="PIN code"
                        value={billingPinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setBillingPinCode(val);
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
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="Phone"
                      value={billingPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setBillingPhone(val);
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

        {/* Right Column: Receipt Printer Machine */}
        <div className="lg:col-span-5 bg-[#f0efe9] border-l border-black/5 px-4 md:px-8 pt-4 md:pt-6 pb-12 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] overflow-y-auto receipt-printer-col">
          
          <div className="max-w-[440px] mx-auto printer-wrapper">

            {/* ── PRINTER HEAD (EXACT DESIGN MATCH) ── */}
            <div className="bg-[#202226] rounded-[28px] border border-white/[0.08] p-6 relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.12)] z-20">
              
              {/* Top Control Bar: Status Pill (Left) + PRINT Button (Right) */}
              <div className="flex justify-between items-center mb-5">
                {/* Status Pill */}
                <div className="bg-[#121316] border border-white/[0.06] rounded-full px-3.5 py-2 flex items-center gap-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                  <span className={`w-2 h-2 rounded-full ${isPrinting ? 'bg-[#22c55e] animate-ping' : 'bg-[#5a5d66] shadow-inner'}`} />
                  <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="text-[11.5px] font-medium text-white/85 font-sans tracking-tight">
                    {isPrinting ? "Printing..." : "Click to print"}
                  </span>
                </div>

                {/* Neumorphic PRINT Button */}
                <button
                  type="button"
                  onClick={triggerPrint}
                  disabled={isPrinting || items.length === 0}
                  className="bg-gradient-to-b from-[#2d2e35] to-[#1c1d22] border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Print receipt"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="text-[11px] font-bold text-white font-sans tracking-wider uppercase">
                    PRINT
                  </span>
                </button>
              </div>

              {/* Inset Main Screen Card */}
              <div className="bg-[#131417] border border-white/[0.06] rounded-[22px] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
                {items.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4 font-medium font-sans">No items in cart</p>
                ) : (
                  <>
                    {/* Top half: Product info + Total */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                        {/* Circular embossed badge with T-shirt icon / product image */}
                        <div
                          className="w-12 h-12 rounded-full bg-gradient-to-b from-[#24262d] to-[#17181c] border border-white/[0.08] overflow-hidden flex items-center justify-center shrink-0 shadow-[0_4px_6px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] cursor-zoom-in transition-transform hover:scale-105"
                          onMouseEnter={(e) => {
                            if (!items[0]?.image) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPreview({
                              image: items[0].image,
                              title: items[0].title,
                              variant: `${items[0].color ? items[0].color : ''}${items[0].size ? (items[0].color ? ' / ' : '') + items[0].size : ''}`,
                              x: rect.left,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredPreview(null)}
                        >
                          {items[0].image ? (
                            <img src={items[0].image} alt={items[0].title} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 3l3 2c1.5 1 4.5 1 6 0l3-2 3 5-3 2v11H6V10L3 8l3-5z" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-white truncate font-sans tracking-tight leading-snug">
                            {items.length === 1 ? items[0].title : `${items[0].title} +${items.length - 1} more`}
                          </h3>
                          <p className="text-[12px] font-medium text-white/45 mt-0.5 font-sans">
                            {items.length === 1
                              ? `${items[0].color ? items[0].color + ' / ' : ''}${items[0].size || ''}`
                              : `${items.reduce((sum, i) => sum + i.quantity, 0)} items total`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 font-sans">TOTAL</p>
                        <p className="text-[26px] font-black text-white font-sans leading-none mt-1 tabular-nums">
                          ₹{totalAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06] my-4" />

                    {/* Bottom half: Status Badge */}
                    <div className="flex items-center gap-2.5">
                      {isPrinting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                          <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider font-sans">
                            PROCESSING YOUR ORDER
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-[#163824] border border-[#22c55e]/30 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-[11px] text-[#22c55e] font-bold uppercase tracking-wider font-sans">
                            ORDER READY FOR CHECKOUT
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Perforated Dot Grid */}
              <div className="mt-5 flex flex-col gap-1.5 items-center justify-center opacity-60">
                <div className="flex gap-1.5">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={`d1-${i}`} className="w-1.5 h-1.5 rounded-full bg-[#0d0e10] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={`d2-${i}`} className="w-1.5 h-1.5 rounded-full bg-[#0d0e10] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={`d3-${i}`} className="w-1.5 h-1.5 rounded-full bg-[#0d0e10] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  ))}
                </div>
              </div>

            </div>

            {/* ── RECEIPT PAPER (slides out from behind printer head) ── */}
            <div className={`receipt-wrapper ${isPrinting ? 'is-printing' : ''} ${receiptVisible ? 'is-visible' : ''}`}>
              <div className="receipt-paper">
                {/* Receipt content */}
                <div className="receipt-content">
                  {/* Shop Header */}
                  <div className="receipt-header">
                    <div>
                      <span className="receipt-shop-name">GODS OWN CULTURE</span><br />
                      <span className="receipt-shop-sub">Luxury Streetwear</span>
                    </div>
                    <div className="receipt-logo">👕</div>
                  </div>

                  <div className="receipt-sub-header" suppressHydrationWarning>
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Product Table */}
                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={`rcpt-${item.variantId}-${idx}`}>
                          <td>
                            <div className="flex items-start gap-3">
                              {item.image ? (
                                <div
                                  className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-black/10 shadow-sm shrink-0 mt-0.5 cursor-zoom-in transition-all hover:scale-105 hover:border-black/30 hover:shadow-md"
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredPreview({
                                      image: item.image,
                                      title: item.title,
                                      variant: `${item.color ? item.color : ''}${item.size ? (item.color ? ' / ' : '') + item.size : ''}`,
                                      x: rect.left,
                                      y: rect.top,
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredPreview(null)}
                                >
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 border border-black/10 flex items-center justify-center shrink-0 mt-0.5 text-base text-gray-400">
                                  👕
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="receipt-item-name">{item.title}</span>
                                <span className="receipt-item-variant">
                                  {item.color && `${item.color}`}{item.size ? ` / ${item.size}` : ''}
                                </span>
                                <div className="receipt-item-actions">
                                  <div className="receipt-qty-ctrl">
                                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Decrease">−</button>
                                    <span>{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                      disabled={item.quantity >= (item.quantityAvailable ?? 999)}
                                      aria-label="Increase"
                                    >+</button>
                                  </div>
                                  <button type="button" onClick={() => removeFromCart(item.variantId)} className="receipt-remove-btn" aria-label="Remove">
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{item.quantity} x</td>
                          <td>₹{(parseFloat(item.price || "0") * item.quantity).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}

                      {/* Coupon code row */}
                      <tr className="receipt-coupon-row">
                        <td colSpan={3}>
                          <div className="receipt-coupon-input">
                            <input
                              type="text"
                              placeholder="COUPON CODE"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                            />
                            <button type="button" onClick={handleApplyDiscount}>Apply</button>
                          </div>
                          {discountError && <p className="receipt-coupon-err">{discountError}</p>}
                          {appliedDiscount > 0 && <p className="receipt-coupon-ok">✓ {appliedDiscount}% OFF</p>}
                        </td>
                      </tr>

                      {/* Subtotal */}
                      <tr className="receipt-subtotal">
                        <td colSpan={2}>Subtotal</td>
                        <td>₹{subTotalNum.toLocaleString("en-IN")}</td>
                      </tr>

                      {/* Discount */}
                      {appliedDiscount > 0 && (
                        <tr className="receipt-discount">
                          <td colSpan={2}>Discount ({appliedDiscount}%)</td>
                          <td>-₹{discountAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      )}

                      {/* Shipping */}
                      <tr className="receipt-shipping">
                        <td colSpan={2}>Shipping</td>
                        <td className="receipt-free">FREE</td>
                      </tr>

                      {/* Total */}
                      <tr className="receipt-total">
                        <td colSpan={2}>Total</td>
                        <td>₹{totalAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer info */}
                  <div className="receipt-footer-info">
                    Payment: Razorpay Secure
                  </div>

                  <div className="receipt-thank-you">Thank you!</div>

                  {/* Barcode */}
                  <div className="receipt-barcode-area">
                    <div className="receipt-barcode" />
                    <span className="receipt-barcode-text" suppressHydrationWarning>GOC-{Math.random().toString(36).substring(2, 6).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Hover Product Image Zoom Popover */}
      {hoveredPreview && (
        <div
          className="fixed z-[99999] pointer-events-none transition-all duration-150 ease-out animate-in fade-in zoom-in-95"
          style={{
            left: `${Math.max(16, hoveredPreview.x - 240)}px`,
            top: `${Math.max(80, Math.min(typeof window !== 'undefined' ? window.innerHeight - 290 : 400, hoveredPreview.y - 80))}px`,
          }}
        >
          <div className="bg-[#18191d]/95 backdrop-blur-md border border-white/20 p-2.5 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] w-56">
            <div className="w-full h-52 rounded-xl overflow-hidden bg-black/60 border border-white/10 relative shadow-inner">
              <img
                src={hoveredPreview.image}
                alt={hoveredPreview.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white/90 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                Preview
              </div>
            </div>
            <div className="px-1 pt-2.5 pb-0.5">
              <p className="text-[12px] font-bold text-white truncate font-sans tracking-tight leading-tight">{hoveredPreview.title}</p>
              {hoveredPreview.variant && (
                <p className="text-[10px] text-white/50 font-medium font-sans mt-0.5">{hoveredPreview.variant}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS custom variables and keyframes for border glowing sweep + receipt printer */}
      <style dangerouslySetInnerHTML={{ __html: `
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to { --angle: 360deg; }
        }

        /* ── Receipt Printer Styles ── */

        .printer-wrapper {
          position: relative;
          user-select: none;
          font-size: 14px;
        }

        /* ── Receipt Paper ── */

        .receipt-wrapper {
          position: relative;
          margin: 0 auto;
          width: calc(100% - 24px);
          filter: drop-shadow(0 4px 16px rgba(0,0,0,0.08));
          /* Hidden by default — clipped inside the printer */
          transform: translateY(-100%);
          clip-path: inset(100% -40px -40px -40px);
          transition: clip-path 0.4s ease;
          z-index: 0;
        }

        .receipt-wrapper.is-printing {
          animation: receiptPrint 1.4s 1 forwards ease-in;
        }

        .receipt-wrapper.is-visible {
          transform: translateY(0);
          clip-path: inset(-20% -40px -40px -40px);
        }

        @keyframes receiptPrint {
          0% {
            transform: translateY(-100%);
            clip-path: inset(100% -40px -40px -40px);
          }
          100% {
            transform: translateY(0);
            clip-path: inset(-20% -40px -40px -40px);
          }
        }

        .receipt-paper {
          position: relative;
          background-color: #f5f5f0;
          padding-top: 6px;
          padding-bottom: 16px;
          clip-path: polygon(
            0% 0%,
            100% 0%,
            100% calc(100% - 4.5px),
            98.75% 100%, 97.5% calc(100% - 4.5px),
            96.25% 100%, 95.0% calc(100% - 4.5px),
            93.75% 100%, 92.5% calc(100% - 4.5px),
            91.25% 100%, 90.0% calc(100% - 4.5px),
            88.75% 100%, 87.5% calc(100% - 4.5px),
            86.25% 100%, 85.0% calc(100% - 4.5px),
            83.75% 100%, 82.5% calc(100% - 4.5px),
            81.25% 100%, 80.0% calc(100% - 4.5px),
            78.75% 100%, 77.5% calc(100% - 4.5px),
            76.25% 100%, 75.0% calc(100% - 4.5px),
            73.75% 100%, 72.5% calc(100% - 4.5px),
            71.25% 100%, 70.0% calc(100% - 4.5px),
            68.75% 100%, 67.5% calc(100% - 4.5px),
            66.25% 100%, 65.0% calc(100% - 4.5px),
            63.75% 100%, 62.5% calc(100% - 4.5px),
            61.25% 100%, 60.0% calc(100% - 4.5px),
            58.75% 100%, 57.5% calc(100% - 4.5px),
            56.25% 100%, 55.0% calc(100% - 4.5px),
            53.75% 100%, 52.5% calc(100% - 4.5px),
            51.25% 100%, 50.0% calc(100% - 4.5px),
            48.75% 100%, 47.5% calc(100% - 4.5px),
            46.25% 100%, 45.0% calc(100% - 4.5px),
            43.75% 100%, 42.5% calc(100% - 4.5px),
            41.25% 100%, 40.0% calc(100% - 4.5px),
            38.75% 100%, 37.5% calc(100% - 4.5px),
            36.25% 100%, 35.0% calc(100% - 4.5px),
            33.75% 100%, 32.5% calc(100% - 4.5px),
            31.25% 100%, 30.0% calc(100% - 4.5px),
            28.75% 100%, 27.5% calc(100% - 4.5px),
            26.25% 100%, 25.0% calc(100% - 4.5px),
            23.75% 100%, 22.5% calc(100% - 4.5px),
            21.25% 100%, 20.0% calc(100% - 4.5px),
            18.75% 100%, 17.5% calc(100% - 4.5px),
            16.25% 100%, 15.0% calc(100% - 4.5px),
            13.75% 100%, 12.5% calc(100% - 4.5px),
            11.25% 100%, 10.0% calc(100% - 4.5px),
            8.75% 100%, 7.5% calc(100% - 4.5px),
            6.25% 100%, 5.0% calc(100% - 4.5px),
            3.75% 100%, 2.5% calc(100% - 4.5px),
            1.25% 100%, 0% calc(100% - 4.5px)
          );
        }

        /* Receipt content area - Crisp, Modern, Highly Legible Typography */
        .receipt-content {
          padding: 18px 20px 8px 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111;
          display: flex;
          flex-direction: column;
          gap: 0.9em;
        }

        /* Receipt header */
        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .receipt-shop-name {
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: #000;
          text-transform: uppercase;
        }
        .receipt-shop-sub {
          font-size: 11px;
          font-weight: 500;
          color: #666;
          margin-top: 2px;
          letter-spacing: 0.02em;
        }
        .receipt-logo {
          font-size: 2.2em;
          line-height: 1;
        }

        .receipt-sub-header {
          border-bottom: 1.5px dashed rgba(0, 0, 0, 0.15);
          padding-bottom: 0.6em;
          font-size: 11px;
          font-weight: 500;
          color: #555;
          letter-spacing: 0.02em;
        }

        /* Receipt table */
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          line-height: 1.5em;
        }
        .receipt-table th {
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        }
        .receipt-table th:last-child,
        .receipt-table td:last-child {
          text-align: right;
        }
        .receipt-table td {
          padding: 6px 0;
          vertical-align: top;
        }

        .receipt-item-name {
          display: block;
          font-weight: 700;
          font-size: 12px;
          color: #111;
          line-height: 1.35;
          letter-spacing: 0.01em;
        }
        .receipt-item-variant {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #666;
          margin-top: 2px;
        }
        .receipt-item-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        .receipt-qty-ctrl {
          display: flex;
          align-items: center;
          border: 1px solid #d1d1d1;
          border-radius: 5px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .receipt-qty-ctrl button {
          width: 22px;
          height: 22px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .receipt-qty-ctrl button:hover:not(:disabled) {
          background: #f0f0f0;
        }
        .receipt-qty-ctrl button:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
        .receipt-qty-ctrl span {
          width: 24px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          border-left: 1px solid #e2e2e2;
          border-right: 1px solid #e2e2e2;
          line-height: 22px;
          color: #111;
        }
        .receipt-remove-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #999;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          padding: 2px;
        }
        .receipt-remove-btn:hover {
          color: #dc2626;
        }

        /* Coupon row */
        .receipt-coupon-row td {
          padding-top: 10px;
          padding-bottom: 8px;
        }
        .receipt-coupon-input {
          display: flex;
          gap: 6px;
        }
        .receipt-coupon-input input {
          flex: 1;
          border: 1px solid #d1d1d1;
          border-radius: 6px;
          padding: 6px 10px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          outline: none;
          background: #fff;
          color: #111;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
          transition: border-color 0.15s;
        }
        .receipt-coupon-input input::placeholder {
          color: #aaa;
          font-weight: 500;
        }
        .receipt-coupon-input input:focus {
          border-color: #000;
        }
        .receipt-coupon-input button {
          border: none;
          background: #111;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background 0.15s;
        }
        .receipt-coupon-input button:hover {
          background: #333;
        }
        .receipt-coupon-err {
          color: #dc2626;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }
        .receipt-coupon-ok {
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }

        /* Subtotal / total rows */
        .receipt-subtotal td {
          border-top: 1.5px dashed rgba(0, 0, 0, 0.15);
          padding-top: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #444;
        }
        .receipt-subtotal td:last-child {
          font-weight: 700;
          color: #111;
        }
        .receipt-discount td {
          color: #16a34a;
          font-weight: 600;
          font-size: 12px;
        }
        .receipt-discount td:last-child {
          font-weight: 700;
        }
        .receipt-shipping td {
          color: #444;
          font-size: 12px;
          font-weight: 500;
        }
        .receipt-free {
          color: #16a34a !important;
          font-weight: 700;
          text-transform: uppercase;
        }
        .receipt-total td {
          border-top: 1.5px dashed rgba(0, 0, 0, 0.15);
          font-weight: 800;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #000;
          padding-top: 10px;
          padding-bottom: 6px;
        }
        .receipt-total td:last-child {
          font-size: 18px;
          font-weight: 900;
        }

        /* Footer info */
        .receipt-footer-info {
          font-size: 11px;
          font-weight: 500;
          color: #666;
          text-align: center;
          border-top: 1.5px dashed rgba(0, 0, 0, 0.15);
          padding-top: 8px;
        }
        .receipt-thank-you {
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #111;
          padding: 2px 0;
        }

        /* Barcode */
        .receipt-barcode-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 6px;
        }
        .receipt-barcode {
          width: 150px;
          height: 36px;
          background: repeating-linear-gradient(
            90deg,
            #111 0px, #111 1.5px,
            transparent 1.5px, transparent 3px,
            #111 3px, #111 4px,
            transparent 4px, transparent 7px,
            #111 7px, #111 8.5px,
            transparent 8.5px, transparent 10px,
            #111 10px, #111 11px,
            transparent 11px, transparent 14px,
            #111 14px, #111 16px,
            transparent 16px, transparent 18px,
            #111 18px, #111 19px,
            transparent 19px, transparent 21px
          );
          opacity: 0.85;
          border-radius: 1px;
        }
        .receipt-barcode-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 700;
          color: #777;
          letter-spacing: 0.25em;
          margin-top: 5px;
        }

        /* Scrollbar for printer column */
        .receipt-printer-col::-webkit-scrollbar {
          width: 4px;
        }
        .receipt-printer-col::-webkit-scrollbar-track {
          background: transparent;
        }
        .receipt-printer-col::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .receipt-printer-col::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      ` }} />
    </main>
  );
}
