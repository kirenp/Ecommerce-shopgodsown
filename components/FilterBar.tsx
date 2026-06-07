"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";

export default function FilterBar() {
  return (
    <div className="w-full bg-black border-b border-white/10 py-4 px-6 md:px-12 flex items-center justify-between sticky top-[104px] z-40 backdrop-blur-md bg-black/80">
      <div className="flex items-center space-x-8">
        <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors group">
          <SlidersHorizontal size={16} />
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Filter</span>
        </button>
        
        <div className="hidden md:flex items-center space-x-6">
          {["Category", "Size", "Color", "Price"].map((filter) => (
            <button key={filter} className="flex items-center space-x-1 text-white/40 hover:text-white transition-colors">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{filter}</span>
              <ChevronDown size={12} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="hidden md:inline text-[10px] text-white/20 tracking-[0.2em] uppercase">12 Products</span>
        <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors group">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Sort By</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
