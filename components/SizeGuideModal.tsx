'use client';

import { useState, useEffect } from 'react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    title?: string;
    handle?: string;
    category?: string;
    [key: string]: any;
  } | null;
}

// T-Shirt Measurements (260 GSM Cotton Boxy Drop Shoulder)
const TSHIRT_DATA = [
  { label: "Across Shoulder", s: "47.5", m: "49", l: "50.5", xl: "52" },
  { label: "1/2 Chest Width", s: "52.5", m: "55", l: "57.5", xl: "60" },
  { label: "1/2 Bottom Width", s: "52.5", m: "55", l: "57.5", xl: "60" },
  { label: "Front Length", s: "64", m: "65", l: "66", xl: "67" },
  { label: "Sleeve Length", s: "22", m: "23", l: "24", xl: "25" },
  { label: "Sleeve Opening (flat)", s: "18.5", m: "19", l: "19.5", xl: "20" },
  { label: "1/2 Bicep", s: "21", m: "22", l: "22.5", xl: "23.5" },
  { label: "Armhole Straight", s: "24", m: "25", l: "26", xl: "27" },
];

// Tank Top Measurements (Kept blank as requested)
const TANK_TOP_DATA = [
  { label: "Chest Width", s: "—", m: "—", l: "—", xl: "—" },
  { label: "Front Length", s: "—", m: "—", l: "—", xl: "—" },
  { label: "Bottom Width", s: "—", m: "—", l: "—", xl: "—" },
  { label: "Shoulder Strap", s: "—", m: "—", l: "—", xl: "—" },
  { label: "Armhole Straight", s: "—", m: "—", l: "—", xl: "—" },
];

function detectProductType(product?: any): 'tshirt' | 'tanktop' {
  if (!product) return 'tshirt';
  const text = `${product.title || ''} ${product.category || ''} ${product.handle || ''}`.toLowerCase();
  if (text.includes('tank') || text.includes('tank top') || text.includes('tank-top')) {
    return 'tanktop';
  }
  return 'tshirt';
}

export default function SizeGuideModal({ isOpen, onClose, product }: SizeGuideModalProps) {
  const [activeCategory, setActiveCategory] = useState<'tshirt' | 'tanktop'>('tshirt');

  // Synchronize active category with current product on open / change
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(detectProductType(product));
    }
  }, [isOpen, product]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTshirt = activeCategory === 'tshirt';
  const currentData = isTshirt ? TSHIRT_DATA : TANK_TOP_DATA;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white text-black p-6 sm:p-8 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Size Guide"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pr-8">
          <div>
            <h3 className="text-2xl font-brand font-semibold">Size Guide</h3>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">
              {isTshirt 
                ? "260 GSM Cotton • Boxy Drop Shoulder T-Shirt" 
                : "Tank Top • Size Specifications"}
            </p>
          </div>

          {/* Category Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-full w-fit">
            <button
              type="button"
              onClick={() => setActiveCategory('tshirt')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                isTshirt 
                  ? "bg-black text-white shadow-sm" 
                  : "text-gray-600 hover:text-black"
              }`}
            >
              T-Shirt
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('tanktop')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                !isTshirt 
                  ? "bg-black text-white shadow-sm" 
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Tank Top
            </button>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50/70">
                <th className="p-3 sm:p-3.5 font-bold text-gray-700 text-left">Measurement</th>
                <th className="p-3 sm:p-3.5 font-bold text-gray-700 text-center">S</th>
                <th className="p-3 sm:p-3.5 font-bold text-gray-700 text-center">M</th>
                <th className="p-3 sm:p-3.5 font-bold text-gray-700 text-center">L</th>
                <th className="p-3 sm:p-3.5 font-bold text-gray-700 text-center">XL</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr 
                  key={row.label}
                  className={`${idx < currentData.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors`}
                >
                  <td className="p-3 sm:p-3.5 font-bold text-gray-900 whitespace-nowrap">{row.label}</td>
                  <td className="p-3 sm:p-3.5 text-gray-600 text-center font-medium">{row.s}</td>
                  <td className="p-3 sm:p-3.5 text-gray-600 text-center font-medium">{row.m}</td>
                  <td className="p-3 sm:p-3.5 text-gray-600 text-center font-medium">{row.l}</td>
                  <td className="p-3 sm:p-3.5 text-gray-600 text-center font-medium">{row.xl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mt-5 text-center">
          {isTshirt 
            ? "All measurements in CM | Tolerance: +/- 0.5 cm"
            : "Tank top size chart data will be updated soon."}
        </p>
      </div>
    </div>
  );
}
