'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WishlistItem {
  id: string;
  title: string;
  handle: string;
  image: string;
  price: string;
  currencyCode?: string;
  color?: string;
  size?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (idOrHandle: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (idOrHandle: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount and validate against Shopify
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goc_wishlist");
      if (saved) {
        const parsed: WishlistItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWishlistItems(parsed);
          const handles = parsed.map(i => i.handle).filter(Boolean);
          if (handles.length > 0) {
            fetch("/api/products/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ handles }),
            })
              .then(res => res.json())
              .then(data => {
                if (data && Array.isArray(data.validHandles)) {
                  const validSet = new Set(data.validHandles);
                  setWishlistItems(prev => prev.filter(item => validSet.has(item.handle)));
                }
              })
              .catch(e => console.warn("Failed to validate wishlist items:", e));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load wishlist items from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Listen for global product removal events (e.g. 404 on product page)
  useEffect(() => {
    const handleProductNotFound = (e: Event) => {
      const customEvent = e as CustomEvent<{ handle?: string; id?: string }>;
      const targetHandle = customEvent.detail?.handle;
      const targetId = customEvent.detail?.id;
      if (targetHandle || targetId) {
        setWishlistItems(prev => prev.filter(i => i.handle !== targetHandle && i.id !== targetId));
      }
    };

    window.addEventListener("goc_product_not_found", handleProductNotFound);
    return () => {
      window.removeEventListener("goc_product_not_found", handleProductNotFound);
    };
  }, []);

  // Save to localStorage on change ONLY AFTER initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("goc_wishlist", JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isLoaded]);

  const isInWishlist = (idOrHandle: string) => {
    return wishlistItems.some(i => i.id === idOrHandle || i.handle === idOrHandle);
  };

  const addToWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id) || isInWishlist(item.handle)) return;
    setWishlistItems(prev => [item, ...prev]);
  };

  const removeFromWishlist = (idOrHandle: string) => {
    setWishlistItems(prev => prev.filter(i => i.id !== idOrHandle && i.handle !== idOrHandle));
  };

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id) || isInWishlist(item.handle)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
