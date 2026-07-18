"use client";

import NextImage from "next/image";
import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { usePreview } from "@/lib/preview";

export default function Footer() {
  const { getPreviewPath } = usePreview();


  return (
    <footer className="bg-white w-full relative z-[1] overflow-hidden">
      {/* Top Section */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 flex flex-col lg:flex-row justify-between gap-12 lg:gap-24 relative z-10">
        
        {/* Left Column */}
        <div className="lg:w-[400px] flex flex-col justify-between">
          <div>
            <h2 className="font-pickyside text-6xl md:text-8xl tracking-[0.08em] uppercase leading-none mb-6">
              <span className="text-[#C81E1E]">GODS</span> <span className="text-[#111111]">OWN</span>
            </h2>
            <p className="text-black/60 text-sm tracking-wider leading-relaxed font-medium mb-12">
              The new standard of streetwear.<br />
              Redefining luxury for the disruptors of today.
            </p>
          </div>
          <p className="text-black/80 font-bold text-xs tracking-widest uppercase mt-8 lg:mt-0">
            © {new Date().getFullYear()} GODSOWNCULTURE. All rights reserved.
          </p>
        </div>

        {/* Vertical Divider (Desktop) */}
        <div className="hidden lg:block w-px bg-black/10 self-stretch"></div>

        {/* Right Column - Links */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Shop */}
          <div>
            <h3 className="text-black text-xs font-bold tracking-[0.2em] uppercase">Shop</h3>
            <div className="w-6 h-[2px] bg-[#C81E1E] mt-4 mb-6"></div>
            <ul className="space-y-4">
              {["Catalog", "New Drops"].map((item) => (
                <li key={item}>
                  <Link href={getPreviewPath("/catalog")} className="text-black/60 hover:text-black text-sm tracking-wider transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-black text-xs font-bold tracking-[0.2em] uppercase">Company</h3>
            <div className="w-6 h-[2px] bg-[#C81E1E] mt-4 mb-6"></div>
            <ul className="space-y-4">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={getPreviewPath(item.href)} className="text-black/60 hover:text-black text-sm tracking-wider transition-colors font-medium">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-black text-xs font-bold tracking-[0.2em] uppercase">Support</h3>
            <div className="w-6 h-[2px] bg-[#C81E1E] mt-4 mb-6"></div>
            <ul className="space-y-4">
              {[
                { label: "Shipping Policy", href: "/shipping-policy" },
                { label: "Refund Policy", href: "/refund-policy" },
                { label: "Terms of Service", href: "/terms-of-service" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={getPreviewPath(item.href)} className="text-black/60 hover:text-black text-sm tracking-wider transition-colors font-medium">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h3 className="text-black text-xs font-bold tracking-[0.2em] uppercase">Follow</h3>
            <div className="w-6 h-[2px] bg-[#C81E1E] mt-4 mb-6"></div>
            <div className="flex space-x-6">
              <a href="#" className="text-black hover:text-[#C81E1E] transition-colors">
                <Instagram size={22} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-black hover:text-[#C81E1E] transition-colors">
                <Facebook size={22} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-black hover:text-[#C81E1E] transition-colors">
                {/* WhatsApp Custom SVG for accuracy */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>


      {/* Bottom Bar */}
      <div className="py-8 text-center bg-white relative z-10 border-t border-black/10">
        <p className="text-black/70 text-sm tracking-widest font-medium">
          Powered by <a href="https://www.instagram.com/webdevtrack/" target="_blank" rel="noopener noreferrer" className="font-bold text-black/50 hover:text-black/80 transition-colors">WEBDEVTRACK</a>
        </p>
      </div>
    </footer>
  );
}
