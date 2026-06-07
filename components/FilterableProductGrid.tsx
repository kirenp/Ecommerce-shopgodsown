'use client';

import { useState, useMemo } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  handle: string;
  image: string;
  title: string;
  price: string;
  maxPrice: string;
  category: string;
  colors: string[];
  sizes: string[];
}

interface FilterableProductGridProps {
  products: Product[];
}

type SortKey = "newest" | "price_asc" | "price_desc" | "az";

export default function FilterableProductGrid({ products }: FilterableProductGridProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(99999);
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  // Derive unique filter values from products
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  const allSizes = useMemo(() => {
    const rawSizes = Array.from(new Set(products.flatMap(p => p.sizes).filter(Boolean)));
    const sizeOrder: Record<string, number> = { "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5 };
    return rawSizes.sort((a, b) => (sizeOrder[a.toUpperCase()] || 99) - (sizeOrder[b.toUpperCase()] || 99));
  }, [products]);
  const allColors = useMemo(() => Array.from(new Set(products.flatMap(p => p.colors).filter(Boolean))), [products]);
  const maxPriceInStore = useMemo(() => Math.ceil(Math.max(...products.map(p => parseFloat(p.maxPrice || p.price) || 0))), [products]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedSize) result = result.filter(p => p.sizes.includes(selectedSize));
    if (selectedColor) result = result.filter(p => p.colors.includes(selectedColor));
    result = result.filter(p => parseFloat(p.price) <= maxPriceFilter);

    switch (sortBy) {
      case "price_asc": result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case "price_desc": result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case "az": result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break; // newest = Shopify order
    }
    return result;
  }, [products, selectedCategory, selectedSize, selectedColor, maxPriceFilter, sortBy]);

  const hasActiveFilters = selectedCategory || selectedSize || selectedColor || maxPriceFilter < maxPriceInStore;

  const toggleDropdown = (name: string) => setActiveDropdown(prev => prev === name ? null : name);

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setMaxPriceFilter(maxPriceInStore || 99999);
    setSortBy("newest");
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="sticky top-[104px] z-40 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Filters */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-white/50">
              <SlidersHorizontal size={14} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Filter</span>
            </div>

            {/* Category */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("category")}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${selectedCategory ? "text-luxury-gold" : "text-white/50 hover:text-white"}`}
              >
                Category {selectedCategory && `(${selectedCategory})`}
                <ChevronDown size={11} className={`transition-transform ${activeDropdown === "category" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "category" && (
                <div className="absolute top-8 left-0 z-50 bg-black border border-white/10 min-w-[160px] py-2 shadow-xl">
                  <button onClick={() => { setSelectedCategory(null); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors">All</button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => { setSelectedCategory(cat); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${selectedCategory === cat ? "text-luxury-gold" : "text-white/60 hover:text-white"}`}>{cat}</button>
                  ))}
                  {categories.length === 0 && <p className="px-4 py-2 text-[10px] text-white/20">No categories</p>}
                </div>
              )}
            </div>

            {/* Size */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("size")}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${selectedSize ? "text-luxury-gold" : "text-white/50 hover:text-white"}`}
              >
                Size {selectedSize && `(${selectedSize})`}
                <ChevronDown size={11} className={`transition-transform ${activeDropdown === "size" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "size" && (
                <div className="absolute top-8 left-0 z-50 bg-black border border-white/10 min-w-[120px] py-2 shadow-xl">
                  <button onClick={() => { setSelectedSize(null); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors">All</button>
                  {allSizes.map(s => (
                    <button key={s} onClick={() => { setSelectedSize(s); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${selectedSize === s ? "text-luxury-gold" : "text-white/60 hover:text-white"}`}>{s}</button>
                  ))}
                  {allSizes.length === 0 && <p className="px-4 py-2 text-[10px] text-white/20">No sizes</p>}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("color")}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${selectedColor ? "text-luxury-gold" : "text-white/50 hover:text-white"}`}
              >
                Color {selectedColor && `(${selectedColor})`}
                <ChevronDown size={11} className={`transition-transform ${activeDropdown === "color" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "color" && (
                <div className="absolute top-8 left-0 z-50 bg-black border border-white/10 min-w-[140px] py-2 shadow-xl">
                  <button onClick={() => { setSelectedColor(null); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors">All</button>
                  {allColors.map(c => (
                    <button key={c} onClick={() => { setSelectedColor(c); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-3 ${selectedColor === c ? "text-luxury-gold" : "text-white/60 hover:text-white"}`}>
                      <span className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.toLowerCase() }} />
                      {c}
                    </button>
                  ))}
                  {allColors.length === 0 && <p className="px-4 py-2 text-[10px] text-white/20">No colors</p>}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="relative hidden md:block">
              <button
                onClick={() => toggleDropdown("price")}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${maxPriceFilter < maxPriceInStore ? "text-luxury-gold" : "text-white/50 hover:text-white"}`}
              >
                Price {maxPriceFilter < maxPriceInStore && `(≤₹${maxPriceFilter.toLocaleString("en-IN")})`}
                <ChevronDown size={11} className={`transition-transform ${activeDropdown === "price" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "price" && (
                <div className="absolute top-8 left-0 z-50 bg-black border border-white/10 w-64 p-5 shadow-xl">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-3">Max Price: ₹{maxPriceFilter.toLocaleString("en-IN")}</p>
                  <input
                    type="range"
                    min={0}
                    max={maxPriceInStore || 10000}
                    step={100}
                    value={maxPriceFilter}
                    onChange={e => setMaxPriceFilter(Number(e.target.value))}
                    className="w-full accent-luxury-gold"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-2">
                    <span>₹0</span>
                    <span>₹{(maxPriceInStore || 10000).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors">
                <X size={10} /> Clear
              </button>
            )}
          </div>

          {/* Right: Count + Sort */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <span className="text-[10px] text-white/25 tracking-widest uppercase hidden md:inline">
              {filtered.length} Product{filtered.length !== 1 ? "s" : ""}
            </span>

            {/* Sort By */}
            <div className="relative">
              <button onClick={() => toggleDropdown("sort")} className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white font-bold tracking-[0.2em] uppercase transition-colors">
                Sort By
                <ChevronDown size={11} className={`transition-transform ${activeDropdown === "sort" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "sort" && (
                <div className="absolute top-8 right-0 z-50 bg-black border border-white/10 min-w-[160px] py-2 shadow-xl">
                  {([
                    { key: "newest", label: "Newest" },
                    { key: "price_asc", label: "Price: Low to High" },
                    { key: "price_desc", label: "Price: High to Low" },
                    { key: "az", label: "A → Z" },
                  ] as { key: SortKey; label: string }[]).map(opt => (
                    <button key={opt.key} onClick={() => { setSortBy(opt.key); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${sortBy === opt.key ? "text-luxury-gold" : "text-white/60 hover:text-white"}`}>{opt.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {activeDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
      )}

      {/* Product Grid */}
      <section className="py-16 px-6 md:px-12 bg-black min-h-[50vh]">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-white/30 text-sm tracking-widest uppercase mb-4">No products match your filters.</p>
              <button onClick={clearAll} className="text-luxury-gold text-[10px] uppercase tracking-widest hover:text-white transition-colors">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  handle={product.handle}
                  image={product.image}
                  title={product.title}
                  price={product.price}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
