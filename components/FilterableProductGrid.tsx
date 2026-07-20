'use client';

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X, Check, RotateCcw } from "lucide-react";
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

const PRODUCTS_PER_PAGE = 8;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "az", label: "A → Z" },
];

// Color name to hex mapping for swatch display
const COLOR_MAP: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  grey: "#808080",
  gray: "#808080",
  red: "#dc2626",
  blue: "#2563eb",
  navy: "#1e3a5f",
  green: "#16a34a",
  olive: "#808000",
  "dark green": "#006400",
  yellow: "#eab308",
  gold: "#d4af37",
  orange: "#ea580c",
  purple: "#9333ea",
  pink: "#ec4899",
  brown: "#8b4513",
  beige: "#f5f5dc",
  cream: "#fffdd0",
  maroon: "#800000",
  teal: "#0d9488",
  cyan: "#06b6d4",
};

function getColorHex(colorName: string): string {
  return COLOR_MAP[colorName.toLowerCase()] || colorName.toLowerCase();
}

export default function FilterableProductGrid({ products }: FilterableProductGridProps) {
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(99999);
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Collapsible sections
  const [sectionsOpen, setSectionsOpen] = useState({
    categories: true,
    size: true,
    color: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Derive unique filter values from products
  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const allSizes = useMemo(() => {
    const rawSizes = Array.from(new Set(products.flatMap(p => p.sizes).filter(Boolean)));
    const sizeOrder: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
    return rawSizes.sort(
      (a, b) => (sizeOrder[a.toUpperCase()] ?? 99) - (sizeOrder[b.toUpperCase()] ?? 99)
    );
  }, [products]);

  const allColors = useMemo(
    () => Array.from(new Set(products.flatMap(p => p.colors).filter(Boolean))),
    [products]
  );

  const maxPriceInStore = useMemo(
    () => Math.ceil(Math.max(...products.map(p => parseFloat(p.maxPrice || p.price) || 0))),
    [products]
  );

  const minPriceInStore = useMemo(
    () => Math.floor(Math.min(...products.map(p => parseFloat(p.price) || 0))),
    [products]
  );

  // Initialize price range on first render
  useMemo(() => {
    if (maxPriceFilter === 99999 && maxPriceInStore > 0) {
      setMaxPriceFilter(maxPriceInStore);
    }
    if (minPriceFilter === 0 && minPriceInStore > 0) {
      setMinPriceFilter(minPriceInStore);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPriceInStore, minPriceInStore]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedSize) result = result.filter(p => p.sizes.includes(selectedSize));
    if (selectedColor) result = result.filter(p => p.colors.includes(selectedColor));
    result = result.filter(p => {
      const pr = parseFloat(p.price);
      return pr >= minPriceFilter && pr <= maxPriceFilter;
    });

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_desc":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    return result;
  }, [products, selectedCategory, selectedSize, selectedColor, minPriceFilter, maxPriceFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filtered.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSize, selectedColor, minPriceFilter, maxPriceFilter, sortBy]);

  const hasActiveFilters =
    selectedCategory ||
    selectedSize ||
    selectedColor ||
    maxPriceFilter < maxPriceInStore ||
    minPriceFilter > minPriceInStore;

  const clearAll = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setMinPriceFilter(minPriceInStore);
    setMaxPriceFilter(maxPriceInStore);
    setSortBy("newest");
    setCurrentPage(1);
  }, [minPriceInStore, maxPriceInStore]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  /* ─── Sidebar Content (shared between desktop & mobile) ─── */
  const sidebarContent = (
    <div className="space-y-0">
      {/* ── Categories ── */}
      <div className="border-b border-white/[0.06]">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between py-5 px-6 text-left"
        >
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white">
            Categories
          </span>
          {sectionsOpen.categories ? (
            <ChevronUp size={14} className="text-white/40" />
          ) : (
            <ChevronDown size={14} className="text-white/40" />
          )}
        </button>
        {sectionsOpen.categories && (
          <div className="px-6 pb-5 space-y-1">
            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-full flex items-center justify-between py-2.5 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-[16px] h-[16px] rounded-[3px] border flex items-center justify-center transition-all duration-200 ${
                    !selectedCategory
                      ? "bg-white border-white"
                      : "bg-transparent border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {!selectedCategory && <Check size={12} className="text-black" strokeWidth={3.5} />}
                </div>
                <span
                  className={`text-[12px] tracking-wide transition-colors ${
                    !selectedCategory ? "text-white" : "text-white/70 group-hover:text-white/90"
                  }`}
                >
                  All Categories
                </span>
              </div>
              <span className="text-[11px] text-white/50 font-medium">{products.length}</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className="w-full flex items-center justify-between py-2.5 group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-[16px] h-[16px] rounded-[3px] border flex items-center justify-center transition-all duration-200 ${
                      selectedCategory === cat
                        ? "bg-white border-white"
                        : "bg-transparent border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {selectedCategory === cat && (
                      <Check size={12} className="text-black" strokeWidth={3.5} />
                    )}
                  </div>
                  <span
                    className={`text-[12px] tracking-wide capitalize transition-colors ${
                      selectedCategory === cat
                        ? "text-white"
                        : "text-white/70 group-hover:text-white/90"
                    }`}
                  >
                    {cat}
                  </span>
                </div>
                <span className="text-[11px] text-white/50 font-medium">
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Size ── */}
      <div className="border-b border-white/[0.06]">
        <button
          onClick={() => toggleSection("size")}
          className="w-full flex items-center justify-between py-5 px-6 text-left"
        >
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90">Size</span>
          {sectionsOpen.size ? (
            <ChevronUp size={14} className="text-white/60" />
          ) : (
            <ChevronDown size={14} className="text-white/60" />
          )}
        </button>
        {sectionsOpen.size && (
          <div className="px-6 pb-5">
            <div className="grid grid-cols-4 gap-2">
              {allSizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                  className={`py-2 rounded-lg text-[11px] font-medium tracking-wider uppercase border transition-all duration-200 flex items-center justify-center ${
                    selectedSize === s
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.02] text-white/60 border-white/[0.1] hover:border-white/30 hover:text-white/90"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {allSizes.length > 0 && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-[10px] text-white/60 hover:text-white uppercase tracking-widest transition-colors underline underline-offset-4"
                >
                  Size Guide
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Color ── */}
      <div className="border-b border-white/[0.06]">
        <button
          onClick={() => toggleSection("color")}
          className="w-full flex items-center justify-between py-5 px-6 text-left"
        >
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white">
            Color
          </span>
          {sectionsOpen.color ? (
            <ChevronUp size={14} className="text-white/60" />
          ) : (
            <ChevronDown size={14} className="text-white/60" />
          )}
        </button>
        {sectionsOpen.color && (
          <div className="px-6 pb-5">
            <div className="flex flex-wrap gap-3">
              {allColors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                  title={c}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                    selectedColor === c
                      ? "ring-1 ring-white/60 ring-offset-2 ring-offset-[#0a0a0a]"
                      : ""
                  }`}
                  style={{ backgroundColor: getColorHex(c) }}
                >
                  {selectedColor === c && (
                    <Check
                      size={12}
                      className={`${
                        ["white", "yellow", "cream", "beige", "gold", "grey"].includes(c.toLowerCase())
                          ? "text-black"
                          : "text-white"
                      }`}
                      strokeWidth={3}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Price ── */}
      <div className="border-b border-white/[0.06]">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between py-5 px-6 text-left"
        >
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90">Price</span>
          {sectionsOpen.price ? (
            <ChevronUp size={14} className="text-white/60" />
          ) : (
            <ChevronDown size={14} className="text-white/60" />
          )}
        </button>
        {sectionsOpen.price && (
          <div className="px-6 pb-6">
            <input
              type="range"
              min={minPriceInStore || 0}
              max={maxPriceInStore || 10000}
              step={100}
              value={maxPriceFilter}
              onChange={e => setMaxPriceFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            />
            <div className="flex justify-between items-center mt-5">
              <span className="text-[11px] text-white/60 tracking-wide">
                ₹{(minPriceFilter || minPriceInStore).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-white/60 tracking-wide">
                ₹{(maxPriceFilter || maxPriceInStore || 10000).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Clear All ── */}
      <div className="p-6">
        <button
          onClick={clearAll}
          disabled={!hasActiveFilters}
          className={`w-full py-3 rounded-xl border text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 ${
            hasActiveFilters
              ? "border-white/30 text-white/90 hover:bg-white/10 hover:text-white"
              : "border-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          <RotateCcw size={12} />
          Clear All
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative z-40">
      {/* ─── Main Layout: Sidebar + Grid ─── */}
      <div className="max-w-[1500px] mx-auto px-6 md:px-8 py-8 flex gap-8">
        {/* ── Desktop Sidebar ── */}
        <aside
          className={`hidden lg:block flex-shrink-0 transition-all duration-500 ease-in-out relative ${
            sidebarOpen ? "w-[280px]" : "w-0"
          }`}
        >
          <div
            className={`sticky top-[104px] h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}
          >
            {/* Apple Liquid Glass Highlight reflection (diagonal glare line) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none z-0" />
            
            <div className="relative z-10">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-white">
                  Filters
                </span>
                <button
                  onClick={toggleSidebar}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {sidebarContent}
            </div>
          </div>
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-black border-r border-white/[0.06] z-[70] lg:hidden overflow-y-auto animate-slide-in-left">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-white">
                  Filters
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {sidebarContent}
            </aside>
          </>
        )}

        {/* ── Product Grid Area ── */}
        <div className="flex-1 min-w-0">
          {/* Top Bar: Product Count + Sort */}
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-4">
              {/* Show sidebar toggle on desktop when sidebar is closed */}
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Filters</span>
                </button>
              )}
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 text-white/50 hover:text-white transition-colors"
              >
                <SlidersHorizontal size={14} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Filters</span>
              </button>

              <span className="text-[11px] text-white/50 tracking-[0.2em] uppercase font-medium">
                {filtered.length} Product{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Sort By Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen(prev => !prev)}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
              >
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden sm:inline">
                  Sort By
                </span>
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 hover:border-white/20 transition-colors">
                  <span className="text-[11px] text-white font-medium tracking-wide uppercase">
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.label || "Newest"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-white/40 transition-transform duration-200 ${
                      sortDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {sortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => setSortDropdownOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 z-[50] bg-[#111] border border-white/[0.08] rounded-xl min-w-[200px] py-2 shadow-2xl overflow-hidden">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-[11px] uppercase tracking-widest transition-colors ${
                          sortBy === opt.key
                            ? "text-white bg-white/[0.05]"
                            : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="pb-32">
            {paginatedProducts.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-white/25 text-sm tracking-widest uppercase mb-4">
                  No products match your filters.
                </p>
                <button
                  onClick={clearAll}
                  className="text-white text-[10px] uppercase tracking-widest hover:text-white/70 transition-colors border border-white/20 px-6 py-2.5 rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedProducts.map(product => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                    currentPage === 1
                      ? "border-white/[0.05] text-white/15 cursor-not-allowed"
                      : "border-white/[0.1] text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <ChevronDown size={16} className="rotate-90" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-10 h-10 flex items-center justify-center text-white/20 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-10 h-10 rounded-lg border text-[12px] font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "bg-white text-black border-white"
                          : "border-white/[0.1] text-white/50 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                    currentPage === totalPages
                      ? "border-white/[0.05] text-white/15 cursor-not-allowed"
                      : "border-white/[0.1] text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <ChevronDown size={16} className="-rotate-90" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal Overlay */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)}></div>
          <div className="relative bg-white text-black p-8 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-brand font-semibold mb-6">Size Guide</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-center">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                    <th className="p-4 font-bold text-gray-700">Size</th>
                    <th className="p-4 font-bold text-gray-700">Chest (in)</th>
                    <th className="p-4 font-bold text-gray-700">Chest (cm)</th>
                    <th className="p-4 font-bold text-gray-700">Length (in)</th>
                    <th className="p-4 font-bold text-gray-700">Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">S</td>
                    <td className="p-4 text-gray-600">21</td>
                    <td className="p-4 text-gray-600">53.34</td>
                    <td className="p-4 text-gray-600">29</td>
                    <td className="p-4 text-gray-600">73.66</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">M</td>
                    <td className="p-4 text-gray-600">22</td>
                    <td className="p-4 text-gray-600">55.88</td>
                    <td className="p-4 text-gray-600">29.5</td>
                    <td className="p-4 text-gray-600">74.93</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">L</td>
                    <td className="p-4 text-gray-600">23</td>
                    <td className="p-4 text-gray-600">58.42</td>
                    <td className="p-4 text-gray-600">30</td>
                    <td className="p-4 text-gray-600">76.20</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold">XL</td>
                    <td className="p-4 text-gray-600">24</td>
                    <td className="p-4 text-gray-600">60.96</td>
                    <td className="p-4 text-gray-600">30.5</td>
                    <td className="p-4 text-gray-600">77.47</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold">XXL</td>
                    <td className="p-4 text-gray-600">25</td>
                    <td className="p-4 text-gray-600">63.50</td>
                    <td className="p-4 text-gray-600">31</td>
                    <td className="p-4 text-gray-600">78.74</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center">Measurements may vary up to 1 inch due to manual calculation.</p>
          </div>
        </div>
      )}
    </div>
  );
}
