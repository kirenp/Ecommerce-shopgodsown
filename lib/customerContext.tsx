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
  checkEmail: (email: string) => Promise<{ exists: boolean; unverified?: boolean; error?: string }>;
  signUp: (email: string) => Promise<{ success: boolean; error?: string }>;
  initiateAuth: (email?: string) => Promise<{ authorizationUrl?: string; error?: string }>;
  logout: (clearShopifySession?: boolean) => void;
  addAddress: (address: Omit<CustomerAddress, 'id'>) => void;
  updateAddress: (id: string, address: Partial<CustomerAddress>) => void;
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

  const loadStoredAddresses = (email: string): CustomerAddress[] => {
    if (typeof window === 'undefined' || !email) return [];
    try {
      const key = `goc_saved_addresses_${email.toLowerCase()}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const persistStoredAddresses = (email: string, addresses: CustomerAddress[]) => {
    if (typeof window === 'undefined' || !email) return;
    try {
      const key = `goc_saved_addresses_${email.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(addresses));
    } catch (e) {}
  };

  const persistLocalCustomer = (cust: CustomerProfile | null) => {
    if (typeof window === 'undefined') return;
    if (cust) {
      try {
        localStorage.setItem("goc_customer_profile", JSON.stringify(cust));
      } catch (e) {}
    } else {
      localStorage.removeItem("goc_customer_profile");
    }
  };

  // ─── Restore session from cookie / localStorage on mount ──────────
  useEffect(() => {
    try {
      let restoredCust: CustomerProfile | null = null;
      const sessionCookie = getCookie("goc_auth_session");
      if (sessionCookie) {
        const session = JSON.parse(sessionCookie);
        if (session.customer && session.customer.email) {
          restoredCust = session.customer;
        }
      }

      if (!restoredCust && typeof window !== 'undefined') {
        const localData = localStorage.getItem("goc_customer_profile");
        if (localData) {
          try {
            restoredCust = JSON.parse(localData);
          } catch (e) {}
        }
      }

      if (restoredCust) {
        setCustomer(restoredCust);
        persistLocalCustomer(restoredCust);
        const storedAddrs = loadStoredAddresses(restoredCust.email);
        if (storedAddrs.length > 0) {
          setSavedAddresses(storedAddrs);
        }
        fetchCustomerData(restoredCust.email);
      }

      // Check URL params for auth callback success/error
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        
        if (params.get("auth_success") === "true") {
          const freshSession = getCookie("goc_auth_session");
          let succCust = restoredCust;
          if (freshSession) {
            const session = JSON.parse(freshSession);
            if (session.customer && session.customer.email) {
              succCust = session.customer;
            }
          }
          if (succCust) {
            setCustomer(succCust);
            persistLocalCustomer(succCust);
            const storedAddrs = loadStoredAddresses(succCust.email);
            if (storedAddrs.length > 0) {
              setSavedAddresses(storedAddrs);
            }
            fetchCustomerData(succCust.email);
          }
          // Dispatch custom event to auto-open account sidebar drawer
          window.dispatchEvent(new Event("goc_auth_success"));

          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        if (params.get("auth_error")) {
          const authErr = params.get("auth_error") || "Authentication failed.";
          console.error("Auth error:", authErr);
          // Dispatch event so AccountSidebar can display the error
          window.dispatchEvent(new CustomEvent("goc_auth_error", { detail: authErr }));
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
          setCustomer(prev => ({ ...(prev || {}), ...json.customer }));
          persistLocalCustomer(json.customer);
        }
        if (json.orders) {
          setOrderHistory(json.orders);
        }
        
        // Combine stored addresses with Admin API returned addresses
        const localAddrs = loadStoredAddresses(email);
        const apiAddrs: CustomerAddress[] = json.addresses || [];
        
        const combined = [...apiAddrs];
        for (const loc of localAddrs) {
          if (!combined.some(a => a.id === loc.id || (a.address === loc.address && a.pinCode === loc.pinCode))) {
            combined.push(loc);
          }
        }
        if (combined.length > 0) {
          setSavedAddresses(combined);
          persistStoredAddresses(email, combined);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch customer data:", err);
    }
  };

  // ─── Check if email exists in Shopify ──────────────────────────────
  const checkEmail = async (email: string): Promise<{ exists: boolean; unverified?: boolean; error?: string }> => {
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
      return { exists: json.exists, unverified: json.unverified };
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
  const initiateAuth = async (email?: string): Promise<{ authorizationUrl?: string; error?: string }> => {
    try {
      // Always clear any previous session before starting new auth flow
      // This prevents stale profile data from a prior login from leaking through
      setCustomer(null);
      setOrderHistory([]);
      setSavedAddresses([]);
      deleteCookie("goc_auth_session");
      deleteCookie("goc_pkce_verifier");
      deleteCookie("goc_pkce_state");
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem("goc_customer_profile"); } catch (e) {}
      }

      const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const clientPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/dev-preview';

      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate-auth", origin: clientOrigin, returnPath: clientPath, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: json.error || "Failed to initiate authentication." };
      }

      // Store PKCE verifier, state, origin and return URL in cookies (for the callback to read)
      if (json.codeVerifier) {
        setCookie("goc_pkce_verifier", json.codeVerifier, 600); // 10 min
      }
      if (json.state) {
        setCookie("goc_pkce_state", json.state, 600);
      }
      if (json.origin || clientOrigin) {
        setCookie("goc_auth_origin", json.origin || clientOrigin, 600);
      }
      if (json.returnPath || clientPath) {
        setCookie("goc_auth_return_url", json.returnPath || clientPath, 600);
      }
      // Store the email the user typed so callback can verify it matches
      if (email) {
        setCookie("goc_auth_intended_email", email.toLowerCase(), 600);
      }

      return { authorizationUrl: json.authorizationUrl };
    } catch (err: any) {
      return { error: err.message || "Network error." };
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = useCallback((clearShopifySession = false) => {
    let idToken: string | undefined = undefined;
    const sessionCookie = getCookie("goc_auth_session");
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        idToken = session.idToken;
      } catch (e) {}
    }

    setCustomer(null);
    setOrderHistory([]);
    setSavedAddresses([]);
    deleteCookie("goc_auth_session");
    deleteCookie("goc_pkce_verifier");
    deleteCookie("goc_pkce_state");
    deleteCookie("goc_auth_origin");
    deleteCookie("goc_auth_return_url");
    deleteCookie("goc_auth_intended_email");

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem("goc_customer_profile");
        sessionStorage.clear();
      } catch (e) {}

      if (clearShopifySession) {
        const clientOrigin = window.location.origin;
        const clientPath = window.location.pathname + window.location.search;
        fetch("/api/customer/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-logout-url", origin: clientOrigin, returnPath: clientPath, idToken }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.logoutUrl) {
              window.location.href = data.logoutUrl;
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // ─── Address management ────────────────────────────────────────────
  const syncAddressToApi = (email: string, addr: any) => {
    fetch("/api/customer/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-address", email, address: addr }),
    }).catch(err => console.warn("Failed to sync address to API:", err));
  };

  const addAddress = (newAddr: Omit<CustomerAddress, 'id'>) => {
    const addrWithId: CustomerAddress = {
      ...newAddr,
      id: `addr_${Date.now()}`,
      isDefault: savedAddresses.length === 0
    };
    setSavedAddresses(prev => {
      const next = [addrWithId, ...prev];
      if (customer?.email) {
        persistStoredAddresses(customer.email, next);
        syncAddressToApi(customer.email, addrWithId);
      }
      return next;
    });
  };

  const updateAddress = (id: string, updatedAddr: Partial<CustomerAddress>) => {
    setSavedAddresses(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updatedAddr } : a);
      if (customer?.email) {
        persistStoredAddresses(customer.email, next);
        const fullAddr = next.find(a => a.id === id);
        if (fullAddr) syncAddressToApi(customer.email, fullAddr);
      }
      return next;
    });
  };

  const removeAddress = (id: string) => {
    setSavedAddresses(prev => {
      const next = prev.filter(a => a.id !== id);
      if (customer?.email) persistStoredAddresses(customer.email, next);
      return next;
    });
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
        updateAddress,
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
