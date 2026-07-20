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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goc_wishlist");
      if (saved) {
        setWishlistItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load wishlist items from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
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
