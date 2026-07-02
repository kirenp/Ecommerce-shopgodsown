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
    { label: "Products", href: "/catalog" },
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

      <nav className="w-full flex flex-col fixed top-0 z-50 transition-all duration-300">
        {/* Announcement Bar */}
        <div className="w-full bg-black py-2 border-b border-luxury-kasavu/20 overflow-hidden relative select-none">
          <div className="flex w-max animate-marquee md:hover:[animation-play-state:paused]">
            <div className="text-[10px] md:text-xs text-luxury-kasavu font-medium tracking-[0.25em] uppercase whitespace-nowrap">
              {"JOIN THE GODS OWN CLUB · LIMITED RELEASES · EXCLUSIVE DROPS · NEW DROPS · GYM & STREET LEGAL · ".repeat(4)}
            </div>
            <div className="text-[10px] md:text-xs text-luxury-kasavu font-medium tracking-[0.25em] uppercase whitespace-nowrap">
              {"JOIN THE GODS OWN CLUB · LIMITED RELEASES · EXCLUSIVE DROPS · NEW DROPS · GYM & STREET LEGAL · ".repeat(4)}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="w-full bg-[#f7f5f2]/95 backdrop-blur-md px-6 md:px-12 py-5 flex items-center justify-between border-b border-black/5">
          {/* Left Links (desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname === getPreviewPath(item.href);
              return (
                <Link
                  key={item.label}
                  href={getPreviewPath(item.href)}
                  className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-colors ${isActive ? "text-luxury-kasavu" : "text-black/60 hover:text-luxury-kasavu"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`w-5 h-[1px] bg-black transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-5 h-[1px] bg-black transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-[1px] bg-black transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <Link href={getPreviewPath("/")} className="font-geishta text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-black tracking-[0.1em] sm:tracking-[0.2em] uppercase whitespace-nowrap">
              GODS <span className="text-red-600">OWN</span>
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-5 md:space-x-7 text-black/60">
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-luxury-kasavu transition-colors"
              aria-label="Search"
            >
              <Search size={17} />
            </button>
            <button className="hover:text-luxury-kasavu transition-colors hidden md:block" aria-label="Account">
              <User size={17} />
            </button>
            <Link href={getPreviewPath("/cart")} className="hover:text-luxury-kasavu transition-colors relative" aria-label="Cart">
              <ShoppingBag size={17} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-[#f7f5f2] border-b border-black/5 px-6 py-6 flex flex-col gap-5">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname === getPreviewPath(item.href);
              return (
                <Link
                  key={item.label}
                  href={getPreviewPath(item.href)}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium tracking-[0.2em] uppercase transition-colors ${isActive ? "text-luxury-kasavu" : "text-black/60 hover:text-luxury-kasavu"
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
