"use client";

import Link from "next/link";
import { Search, User, ShoppingBag, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import { usePreview } from "@/lib/preview";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { isPreview, getPreviewPath } = usePreview();
  const isHomePage = pathname === "/" || pathname === "/dev-preview" || pathname === getPreviewPath("/");

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${getPreviewPath("/catalog")}?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/catalog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center px-6">
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="border-b border-white/20 flex items-center gap-4 pb-4">
              <Search size={20} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-white text-2xl font-light tracking-wide outline-none placeholder:text-white/20"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <p className="text-white/20 text-xs tracking-widest uppercase mt-4">Press Enter to search</p>
          </form>
        </div>
      )}

      <nav className="w-full flex flex-col absolute top-0 z-50">
        {/* Announcement Bar */}
        <div className="w-full bg-black py-2.5 overflow-hidden relative select-none">
          <div className="flex w-max animate-marquee md:hover:[animation-play-state:paused]">
            <div className="text-[9px] md:text-[10px] text-[#C9A45C] font-semibold tracking-[0.3em] uppercase whitespace-nowrap">
              {"JOIN THE GODS OWN CLUB · LIMITED RELEASES · EXCLUSIVE DROPS · NEW DROPS · GYM & STREET LEGAL · ".repeat(4)}
            </div>
            <div className="text-[9px] md:text-[10px] text-[#C9A45C] font-semibold tracking-[0.3em] uppercase whitespace-nowrap">
              {"JOIN THE GODS OWN CLUB · LIMITED RELEASES · EXCLUSIVE DROPS · NEW DROPS · GYM & STREET LEGAL · ".repeat(4)}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={`w-full ${isHomePage ? 'bg-[#F7F4EF]/95' : 'bg-white/95'} backdrop-blur-md px-6 md:px-12 flex items-center justify-between h-20 relative`}>
          {/* Left Links (desktop, restored as before) */}
          <div className="hidden md:flex items-center space-x-10 h-full z-10">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname === getPreviewPath(item.href);
              return (
                <Link
                  key={item.label}
                  href={getPreviewPath(item.href)}
                  className={`relative py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-black/60 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-black after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100 ${
                    isActive ? "text-black after:scale-x-100 after:origin-bottom-left" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1 z-10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`w-5 h-[1px] bg-black transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-5 h-[1px] bg-black transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-[1px] bg-black transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>

          {/* Logo (centered inside the header bar) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 mt-1.5 md:mt-2 z-30">
            <Link href={getPreviewPath("/")} className="font-pickyside text-3xl sm:text-4xl md:text-[44px] font-light tracking-[0.08em] uppercase whitespace-nowrap select-none">
              <span className="text-[#C81E1E]">GODS</span> <span className="text-[#111111]">OWN</span>
            </Link>
          </div>

          {/* Decorative Notch dipping below the header under the logo */}
          <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full ${isHomePage ? 'bg-[#F7F4EF]/95' : 'bg-white/95'} backdrop-blur-md w-56 md:w-64 h-4.5 rounded-b-xl z-20 shadow-md shadow-black/5 pointer-events-none`} />

          {/* Right Icons & Search Bar (Search placed on the right side) */}
          <div className="flex items-center space-x-6 md:space-x-8 text-black/60 z-10">
            {/* Search Input Box (desktop only, on the right side) */}
            <div className="hidden md:flex relative items-center bg-black/5 rounded-full px-4 py-2 w-60">
              <Search size={13} className="text-black/40 mr-2.5" />
              <input
                type="text"
                placeholder="What are you looking for..."
                className="bg-transparent text-[11px] font-light outline-none text-black placeholder:text-black/35 w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
              />
            </div>

            {/* Mobile-only standalone Search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-[#C9A45C] transition-colors md:hidden"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button className="hover:text-[#C9A45C] transition-colors hidden md:block" aria-label="Account">
              <User size={18} />
            </button>
            <Link href={getPreviewPath("/cart")} className="hover:text-[#C9A45C] transition-colors relative" aria-label="Cart">
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C81E1E] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className={`md:hidden ${isHomePage ? 'bg-[#F7F4EF]' : 'bg-white'} border-b border-black/5 px-6 py-8 flex flex-col gap-6 animate-fade-in shadow-lg`}>
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname === getPreviewPath(item.href);
              return (
                <Link
                  key={item.label}
                  href={getPreviewPath(item.href)}
                  onClick={() => setMenuOpen(false)}
                  className={`text-xs font-semibold tracking-[0.25em] uppercase transition-colors ${
                    isActive ? "text-[#C81E1E]" : "text-black/60 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
