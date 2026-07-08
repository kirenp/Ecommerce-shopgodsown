'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePreview } from "@/lib/preview";

export default function Hero() {
  const { getPreviewPath } = usePreview();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className={`w-full px-4 md:px-8 pt-24 md:pt-28 pb-8 bg-[#F7F4EF] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
      <div 
        className="w-full aspect-[1086/1448] md:aspect-[1693/929] h-auto rounded-[32px] relative overflow-hidden flex flex-col justify-between p-6 md:p-12 shadow-lg shadow-black/5"
      >
        {/* Desktop Banner Background Image */}
        <div className="absolute inset-0 z-0 hidden md:block">
          <img
            src="/images/bannerimageseason.png"
            alt="GODS OWN Season Banner"
            className="w-full h-full object-cover select-none"
          />
          {/* Subtle dark overlay to ensure text and glassmorphic button readability */}
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        </div>

        {/* Mobile Banner Background Image */}
        <div className="absolute inset-0 z-0 block md:hidden">
          <img
            src="/images/banner-mobile-season.png"
            alt="GODS OWN Season Banner Mobile"
            className="w-full h-full object-cover select-none"
          />
          {/* Subtle dark overlay to ensure text and glassmorphic button readability */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* ── CENTERED FLOATING BUTTON (Positioned precisely in the EXCLUSIVE DROP gap) ── */}
        <div className="absolute left-1/2 top-[46.5%] md:top-[44%] -translate-x-1/2 -translate-y-1/2 z-10">
          <button 
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border border-white/40 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 hover:bg-black/20 hover:rotate-12 transition-all duration-500 shadow-md hover:shadow-lg group"
            onClick={() => {
              const element = document.getElementById("collections");
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = getPreviewPath("/catalog");
              }
            }}
          >
            <span className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-white leading-normal transition-transform duration-300 group-hover:scale-105">
              DISCOVER<br/>MORE
            </span>
          </button>
        </div>

        {/* ── BOTTOM RIGHT DESCRIPTION COLUMN ── */}
        <div className="w-full flex justify-center md:justify-end z-10 mt-auto">
          <div className="flex flex-col items-center md:items-end gap-5 text-center md:text-right">
            <p className="text-[10px] md:text-xs leading-relaxed text-white/80 font-semibold tracking-[0.05em] uppercase max-w-[280px] md:max-w-[340px]">
              Crafted for those who embrace culture, confidence and individuality.
            </p>
            {/* Minimal decorative gold divider */}
            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent relative flex items-center justify-center">
              <span className="absolute text-[8px] text-[#C9A45C] bg-[#111111] px-2 rounded-sm">✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
