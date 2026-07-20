'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RecentlyViewedItem {
  id: string;
  title: string;
  handle: string;
  image: string;
  price: string;
  currencyCode?: string;
  category?: string;
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[];
  addRecentlyViewed: (item: RecentlyViewedItem) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goc_recently_viewed");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recently viewed items from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change ONLY AFTER initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("goc_recently_viewed", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addRecentlyViewed = (newItem: RecentlyViewedItem) => {
    if (!newItem || !newItem.handle) return;
    setItems(prev => {
      // Filter out existing occurrence of the same product
      const filtered = prev.filter(i => i.handle !== newItem.handle && i.id !== newItem.id);
      // Place newest item at the top and cap at 12 items
      return [newItem, ...filtered].slice(0, 12);
    });
  };

  const clearRecentlyViewed = () => {
    setItems([]);
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, addRecentlyViewed, clearRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return ctx;
}
