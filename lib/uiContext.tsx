'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isQuickViewOpen: boolean;
    quickViewProduct: any | null;
    openQuickView: (product: any) => void;
    closeQuickView: () => void;
    isCartSidebarOpen: boolean;
    openCartSidebar: () => void;
    closeCartSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
    const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

    const openQuickView = (product: any) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const closeQuickView = () => {
        setIsQuickViewOpen(false);
        setTimeout(() => setQuickViewProduct(null), 300); // Clear after animation
    };

    const openCartSidebar = () => {
        setIsCartSidebarOpen(true);
    };

    const closeCartSidebar = () => {
        setIsCartSidebarOpen(false);
    };

    return (
        <UIContext.Provider
            value={{
                isQuickViewOpen,
                quickViewProduct,
                openQuickView,
                closeQuickView,
                isCartSidebarOpen,
                openCartSidebar,
                closeCartSidebar,
            }}
        >
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
