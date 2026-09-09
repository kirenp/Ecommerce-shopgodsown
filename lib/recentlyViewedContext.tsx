'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
  removeRecentlyViewed: (handleOrId: string) => void;
  clearRecentlyViewed: () => void;
  validateRecentlyViewed: () => Promise<void>;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const validateRecentlyViewed = useCallback(async () => {
    try {
      const saved = localStorage.getItem("goc_recently_viewed");
      if (!saved) return;
      const currentList: RecentlyViewedItem[] = JSON.parse(saved);
      if (!Array.isArray(currentList) || currentList.length === 0) return;

      const handles = currentList.map(i => i.handle).filter(Boolean);
      if (handles.length === 0) return;

      const res = await fetch("/api/products/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles }),
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data && Array.isArray(data.validHandles)) {
        const validSet = new Set(data.validHandles);
        const prodMap = new Map<string, any>(
          (data.validProducts || []).map((p: any) => [p.handle, p])
        );

        setItems(prev => {
          const filtered = prev.filter(item => validSet.has(item.handle));
          return filtered.map(item => {
            const updated = prodMap.get(item.handle);
            if (updated) {
              return {
                ...item,
                title: updated.title || item.title,
                price: updated.price || item.price,
                currencyCode: updated.currencyCode || item.currencyCode,
                image: updated.image || item.image,
              };
            }
            return item;
          });
        });
      }
    } catch (e) {
      console.warn("Failed to validate recently viewed items:", e);
    }
  }, []);

  // Load from localStorage on mount and validate
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

    validateRecentlyViewed();
  }, [validateRecentlyViewed]);

  // Listen for global product removal events (e.g. 404 on product page)
  useEffect(() => {
    const handleProductNotFound = (e: Event) => {
      const customEvent = e as CustomEvent<{ handle?: string; id?: string }>;
      const targetHandle = customEvent.detail?.handle;
      const targetId = customEvent.detail?.id;
      if (targetHandle || targetId) {
        setItems(prev => prev.filter(i => i.handle !== targetHandle && i.id !== targetId));
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

  const removeRecentlyViewed = (handleOrId: string) => {
    setItems(prev => prev.filter(i => i.handle !== handleOrId && i.id !== handleOrId));
  };

  const clearRecentlyViewed = () => {
    setItems([]);
  };

  return (
    <RecentlyViewedContext.Provider
      value={{
        items,
        addRecentlyViewed,
        removeRecentlyViewed,
        clearRecentlyViewed,
        validateRecentlyViewed,
      }}
    >
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

