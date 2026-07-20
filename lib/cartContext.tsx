'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  variantId: string;
  handle: string;
  title: string;
  image: string;
  color: string;
  size: string;
  price: string;
  currencyCode: string;
  quantity: number;
  quantityAvailable?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: string;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goc_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change ONLY AFTER initial load has completed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("goc_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      let nextItems;
      const existing = prev.find(i => i.variantId === item.variantId);
      const maxStock = item.quantityAvailable ?? 999;
      const qtyToAdd = item.quantity || 1;

      if (existing) {
        const newQty = existing.quantity + qtyToAdd;
        if (newQty > maxStock) {
          alert(`Not enough stock available. You can only add up to ${maxStock} item${maxStock === 1 ? '' : 's'} for this variant (${item.color ? item.color + ' / ' : ''}${item.size || ''}).`);
          return prev;
        }
        nextItems = prev.map(i => i.variantId === item.variantId ? { ...i, quantity: newQty, quantityAvailable: maxStock } : i);
      } else {
        if (maxStock < 1) {
          alert(`This item (${item.color ? item.color + ' / ' : ''}${item.size || ''}) is currently out of stock.`);
          return prev;
        }
        if (qtyToAdd > maxStock) {
          alert(`Not enough stock available. You can only add up to ${maxStock} item${maxStock === 1 ? '' : 's'} for this variant.`);
          return prev;
        }
        nextItems = [...prev, { ...item, quantity: qtyToAdd, quantityAvailable: maxStock }];
      }
      try {
        localStorage.setItem("goc_cart", JSON.stringify(nextItems));
      } catch (e) {
        console.error("Failed to save cart to localStorage:", e);
      }
      return nextItems;
    });
  };

  const removeFromCart = (variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, qty: number) => {
    if (qty < 1) { removeFromCart(variantId); return; }
    setItems(prev => prev.map(i => {
      if (i.variantId === variantId) {
        const maxStock = i.quantityAvailable ?? 999;
        if (qty > maxStock) {
          alert(`Not enough stock available. You can only add up to ${maxStock} item${maxStock === 1 ? '' : 's'} for this variant.`);
          return { ...i, quantity: maxStock };
        }
        return { ...i, quantity: qty };
      }
      return i;
    }));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0).toFixed(2);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
