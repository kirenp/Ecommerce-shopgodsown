"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePreview } from "@/lib/preview";

export default function PromiseBanner() {
  const { getPreviewPath } = usePreview();

  return (
    <section className="w-full px-4 md:px-8 pt-0 pb-10 bg-black border-t border-white/5">
      {/* ── Apple Liquid Glass Card ── */}
      <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl min-h-[240px] md:min-h-[360px] lg:min-h-[420px] isolate">

        {/* 1. Background image */}
        <Image
          src="/images/promise-banner-bg.png"
          alt="Gods Own — Made with Purpose"
          fill
          className="object-cover object-center"
          priority
        />

        {/* 2. Base dark scrim — makes glass readable on dark image */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        {/* 3. Glass body — the frosted translucent pane */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent" />

        {/* 4. Top specular edge highlight (thin bright line at top) */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* 5. Left specular edge highlight */}
        <div className="absolute inset-y-0 left-0 w-[1.5px] bg-gradient-to-b from-white/40 via-white/10 to-transparent" />

        {/* 6. Bottom edge subtle rim */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* 7. Right edge rim */}
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

        {/* 8. Inner border frame (the hallmark glass outline) */}
        <div className="absolute inset-[1px] rounded-2xl md:rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />

        {/* 9. Animated left-to-right glare sweep — the "shine" */}
        <div
          className="animate-glass-shine absolute inset-y-0 w-[35%] pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)",
            left: 0,
          }}
        />

        {/* 10. Static diagonal glare (always-on subtle highlight) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.10] pointer-events-none" />

        {/* 11. Bottom glow bloom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* ── Content ── */}
        <div className="relative z-10 h-full flex items-center px-8 sm:px-12 md:px-16 lg:px-24 py-14 md:py-20">
          <div className="max-w-lg">
            {/* Label */}
            <p className="text-[#C81E1E] text-[10px] md:text-[11px] font-bold tracking-[0.35em] uppercase mb-4 md:mb-5 drop-shadow-sm">
              Our Promise
            </p>

            {/* Heading */}
            <h2 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-5 md:mb-7 drop-shadow-lg">
              Made With<br />Purpose
            </h2>

            {/* Body text */}
            <p className="text-white/60 text-xs sm:text-sm md:text-base leading-relaxed max-w-sm mb-8 md:mb-10 tracking-wide">
              Every piece we create is a reflection of who we are<br className="hidden sm:block" />
              and what we stand for. No compromises. Ever.
            </p>

            {/* CTA Button — also glass-styled */}
            <Link
              href={getPreviewPath("/about")}
              className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/60 text-white text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-all duration-400 group shadow-lg shadow-black/20"
            >
              Our Story
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
