'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface CustomerAddress {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  isDefault?: boolean;
}

export interface CustomerOrderItem {
  title: string;
  quantity: number;
  price: string;
  image?: string;
  size?: string;
  color?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  processedAt: string;
  totalPrice: string;
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED' | 'IN_TRANSIT' | 'DELIVERED';
  financialStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  items: CustomerOrderItem[];
  trackingNumber?: string;
  trackingCompany?: string;
  trackingUrl?: string;
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  acceptsMarketing: boolean;
  tier: string;
  points: number;
}

interface CustomerContextType {
  customer: CustomerProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  savedAddresses: CustomerAddress[];
  orderHistory: CustomerOrder[];
  checkEmail: (email: string) => Promise<{ exists: boolean; error?: string }>;
  signUp: (email: string) => Promise<{ success: boolean; error?: string }>;
  initiateAuth: () => Promise<{ authorizationUrl?: string; error?: string }>;
  logout: () => void;
  addAddress: (address: Omit<CustomerAddress, 'id'>) => void;
  removeAddress: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ─── Restore session from cookie on mount ──────────────────────────
  useEffect(() => {
    try {
      const sessionCookie = getCookie("goc_auth_session");
      if (sessionCookie) {
        const session = JSON.parse(sessionCookie);
        
        if (session.customer) {
          setCustomer(session.customer);
          
          // Fetch latest orders from Admin API
          if (session.customer.email) {
            fetchCustomerData(session.customer.email);
          }
        }
      }

      // Check URL params for auth callback success/error
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        
        if (params.get("auth_success") === "true") {
          // Re-read cookie after redirect — it was just set by the callback
          const freshSession = getCookie("goc_auth_session");
          if (freshSession) {
            const session = JSON.parse(freshSession);
            if (session.customer) {
              setCustomer(session.customer);
              if (session.customer.email) {
                fetchCustomerData(session.customer.email);
              }
            }
          }
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        if (params.get("auth_error")) {
          console.error("Auth error:", params.get("auth_error"));
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (e) {
      console.error("Failed to restore customer session:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders/addresses from Admin API
  const fetchCustomerData = async (email: string) => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-customer-data", email }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.customer) {
          setCustomer(json.customer);
        }
        if (json.orders) {
          setOrderHistory(json.orders);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch customer data:", err);
    }
  };

  // ─── Check if email exists in Shopify ──────────────────────────────
  const checkEmail = async (email: string): Promise<{ exists: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-email", email }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { exists: false, error: json.error || "Failed to check email." };
      }
      return { exists: json.exists };
    } catch (err: any) {
      return { exists: false, error: err.message || "Network error." };
    }
  };

  // ─── Sign Up: Create customer then initiate OTP auth ───────────────
  const signUp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-customer", email }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to create account." };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error." };
    }
  };

  // ─── Initiate Shopify OAuth (redirects to OTP page) ────────────────
  const initiateAuth = async (): Promise<{ authorizationUrl?: string; error?: string }> => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate-auth" }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: json.error || "Failed to initiate authentication." };
      }

      // Store PKCE verifier, state, and return URL in cookies (for the callback to read)
      if (json.codeVerifier) {
        setCookie("goc_pkce_verifier", json.codeVerifier, 600); // 10 min
      }
      if (json.state) {
        setCookie("goc_pkce_state", json.state, 600);
      }
      if (json.returnPath) {
        setCookie("goc_auth_return_url", json.returnPath, 600);
      } else if (typeof window !== 'undefined') {
        setCookie("goc_auth_return_url", window.location.pathname + window.location.search, 600);
      }

      return { authorizationUrl: json.authorizationUrl };
    } catch (err: any) {
      return { error: err.message || "Network error." };
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setCustomer(null);
    setOrderHistory([]);
    setSavedAddresses([]);
    deleteCookie("goc_auth_session");
    deleteCookie("goc_pkce_verifier");
    deleteCookie("goc_pkce_state");
  }, []);

  // ─── Address management ────────────────────────────────────────────
  const addAddress = (newAddr: Omit<CustomerAddress, 'id'>) => {
    const addrWithId: CustomerAddress = {
      ...newAddr,
      id: `addr_${Date.now()}`,
      isDefault: savedAddresses.length === 0
    };
    setSavedAddresses(prev => [addrWithId, ...prev]);
  };

  const removeAddress = (id: string) => {
    setSavedAddresses(prev => prev.filter(a => a.id !== id));
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        loading,
        savedAddresses,
        orderHistory,
        checkEmail,
        signUp,
        initiateAuth,
        logout,
        addAddress,
        removeAddress,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return ctx;
}
