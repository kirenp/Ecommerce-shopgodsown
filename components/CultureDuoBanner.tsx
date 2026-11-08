'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { usePreview } from '@/lib/preview';

interface CultureDuoBannerProps {
  productHandle?: string;
  originalPrice?: string;
  bundlePrice?: string;
  savings?: string;
}

export default function CultureDuoBanner({
  productHandle = 'the-culture-duo',
  originalPrice = '₹1,698',
  bundlePrice = '₹1,349',
  savings = 'SAVE ₹349',
}: CultureDuoBannerProps) {
  const { getPreviewPath } = usePreview();
  const targetUrl = getPreviewPath(`/products/${productHandle}`);

  return (
    <section className="relative w-full bg-[#f7f5f2] px-4 sm:px-6 md:px-12 lg:px-16 py-4 md:py-8 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          href={targetUrl}
          aria-label="Shop The Culture Duo bundle offer"
          className="group block relative w-full overflow-hidden rounded-2xl md:rounded-[28px] lg:rounded-[32px] bg-[#0c0908] border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {/* ============================================================== */}
          {/* DESKTOP BANNER (md and up)                                      */}
          {/* Uses: public/images/GODS OWN Streetwear Studio Portrait.png      */}
          {/* Aspect: 1774 x 887 (2:1 ratio)                                 */}
          {/* ============================================================== */}
          <div className="hidden md:block relative w-full aspect-[1774/887] min-h-[460px] lg:min-h-[520px]">
            {/* Background Photographic Artwork */}
            <Image
              src="/images/GODS OWN Streetwear Studio Portrait.png"
              alt="The Culture Duo - Gods Own Streetwear Studio Portrait"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, (min-width: 768px) 100vw, 100vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />

            {/* Gradient overlay on the left to guarantee optimal text contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent w-full lg:w-3/5 pointer-events-none"
              aria-hidden="true"
            />

            {/* Desktop Left-Aligned Content Overlay */}
            <div className="relative z-10 flex flex-col justify-center h-full max-w-xl lg:max-w-2xl px-8 sm:px-12 lg:px-16 py-8">
              {/* Eyebrow: BUNDLE OFFER (no dash line) */}
              <div className="mb-3 lg:mb-4">
                <span className="text-[#DC2626] text-xs lg:text-sm font-extrabold tracking-[0.25em] uppercase">
                  Bundle Offer
                </span>
              </div>

              {/* Headline: THE CULTURE DUO in normal bold sans-serif */}
              <h2 className="font-sans font-black uppercase text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[58px] leading-[0.92] tracking-tight text-[#FAF7F2] select-none">
                <span className="block">The</span>
                <span className="block mt-1 sm:mt-1.5">Culture Duo</span>
              </h2>

              {/* Subtitle description with Culture Duo kept together */}
              <p className="mt-3 lg:mt-4 text-[#D2CCC0] text-xs sm:text-sm lg:text-base font-normal leading-relaxed max-w-md lg:max-w-lg">
                Two essentials. One statement. Get your hands on{' '}
                <span className="whitespace-nowrap font-medium text-white">the Culture Duo</span>: a T-shirt and tank top for just{' '}
                <span className="font-semibold text-white">{bundlePrice}</span>.
              </p>

              {/* Price Row: Strikethrough + Red Pill + Savings Badge */}
              <div className="flex items-center gap-3 lg:gap-4 mt-5 lg:mt-7 flex-wrap">
                <span className="text-[#8E877D] line-through text-lg lg:text-2xl font-semibold tracking-wide">
                  {originalPrice}
                </span>

                <span className="text-white/20 text-lg select-none" aria-hidden="true">
                  |
                </span>

                <span className="bg-[#B31919] text-white font-bold text-lg lg:text-2xl px-3.5 lg:px-4 py-1 lg:py-1.5 rounded-lg shadow-md tracking-tight">
                  {bundlePrice}
                </span>

                <span className="border border-white/40 rounded-full px-3.5 lg:px-4 py-1 text-xs lg:text-sm font-bold text-white tracking-wider uppercase">
                  {savings}
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-6 lg:mt-8">
                <span className="inline-flex items-center gap-2.5 rounded-full bg-[#EFE9DF] group-hover:bg-white text-black font-extrabold uppercase tracking-widest text-xs lg:text-sm px-7 lg:px-8 py-3.5 lg:py-4 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95">
                  <span>Shop The Combo</span>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5"
                    strokeWidth={2.5}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* MOBILE BANNER (< md)                                            */}
          {/* Uses: public/images/GODS OWN Models Against Red Stripes.png      */}
          {/* Aspect: 1086 x 1448 (exact 3:4 ratio)                           */}
          {/* ============================================================== */}
          <div className="block md:hidden relative w-full aspect-[1086/1448]">
            {/* Background Photographic Artwork */}
            <Image
              src="/images/GODS OWN Models Against Red Stripes.png"
              alt="The Culture Duo - Gods Own Models Against Red Stripes"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />

            {/* Top gradient for title contrast */}
            <div
              className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-black/95 via-black/50 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Bottom gradient for button contrast */}
            <div
              className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Top Content: Eyebrow + Headline + Description + Prices */}
            <div className="relative z-10 flex flex-col px-4 pt-4 sm:px-6 sm:pt-6 text-left">
              {/* Eyebrow: BUNDLE OFFER (no dash line) */}
              <div className="mb-1 sm:mb-1.5">
                <span className="text-[#DC2626] text-[10px] sm:text-xs font-extrabold tracking-[0.22em] uppercase">
                  Bundle Offer
                </span>
              </div>

              {/* Headline: THE CULTURE DUO in normal bold sans-serif */}
              <h2 className="font-sans font-black uppercase text-[21px] xs:text-[23px] sm:text-[28px] leading-[0.92] tracking-tight text-[#FAF7F2] select-none">
                <span className="block">The</span>
                <span className="block mt-0.5">Culture Duo</span>
              </h2>

              {/* Description with Culture Duo kept together */}
              <p className="mt-1.5 sm:mt-2 text-[#D2CCC0] text-[10px] xs:text-[11px] sm:text-xs leading-[1.35] max-w-[280px] sm:max-w-xs">
                Two essentials. One statement. Get your hands on{' '}
                <span className="whitespace-nowrap font-medium text-white">the Culture Duo</span>: a T-shirt and tank top for just{' '}
                <span className="font-semibold text-white">{bundlePrice}</span>.
              </p>

              {/* Prices */}
              <div className="flex items-center gap-2 sm:gap-2.5 mt-2 sm:mt-3 flex-nowrap">
                <span className="text-[#8E877D] line-through text-xs sm:text-sm font-semibold tracking-wide">
                  {originalPrice}
                </span>

                <span className="text-white/20 text-xs sm:text-sm select-none" aria-hidden="true">
                  |
                </span>

                <span className="bg-[#B31919] text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-0.5 rounded-md shadow-md tracking-tight">
                  {bundlePrice}
                </span>

                <span className="border border-white/40 rounded-full px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase whitespace-nowrap">
                  {savings}
                </span>
              </div>
            </div>

            {/* Bottom Content: Centered Action Button */}
            <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-10 flex justify-center px-4 sm:px-6">
              <span className="w-full max-w-[280px] sm:max-w-xs inline-flex items-center justify-center gap-2 rounded-full bg-[#EFE9DF] group-hover:bg-white text-black font-extrabold uppercase tracking-widest text-[10.5px] sm:text-xs py-3 sm:py-3.5 shadow-2xl transition-all duration-300 group-hover:scale-105 active:scale-95">
                <span>Shop The Combo</span>
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
