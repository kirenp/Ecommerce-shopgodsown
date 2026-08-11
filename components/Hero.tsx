'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePreview } from "@/lib/preview";

export default function Hero() {
  const { getPreviewPath } = usePreview();
  const [mounted, setMounted] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger slow load animation for the button after a short delay
    const timer = setTimeout(() => {
      setButtonVisible(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`w-full px-4 md:px-8 pt-[128px] md:pt-[132px] pb-4 md:pb-6 bg-[#F7F4EF] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
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
            src="/images/banner-mobile-newseason.png"
            alt="GODS OWN Season Banner Mobile"
            className="w-full h-full object-cover select-none"
          />
          {/* Subtle dark overlay to ensure text and glassmorphic button readability */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* ── BOTTOM RIGHT FLOATING BUTTON ── */}
        <div 
          className={`absolute z-10 transition-all duration-[1200ms] ease-out ${
            buttonVisible 
              ? 'opacity-100 scale-100 bottom-6 right-6 md:bottom-12 md:right-12' 
              : 'opacity-0 scale-90 bottom-2 right-2 md:bottom-8 md:right-8'
          }`}
        >
          <div className="relative rounded-full p-[2px] overflow-hidden flex items-center justify-center group shadow-[0_0_15px_rgba(255,0,0,0.3)]">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(255,0,0,1)_360deg)] animate-[spin_2s_linear_infinite]" />
            <button 
              className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 hover:bg-black/60 transition-all duration-500 shadow-md group-hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
              onClick={() => {
                const element = document.getElementById("collections");
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = getPreviewPath("/catalog");
                }
              }}
            >
              <span className="text-[8px] md:text-[10px] font-semibold tracking-[0.2em] uppercase text-white leading-normal transition-transform duration-300 group-hover:scale-105">
                DISCOVER<br/>MORE
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
