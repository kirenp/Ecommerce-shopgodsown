'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

const HERO_SLIDES = [
  {
    desktop: "/images/bannernew.png",
    mobile: "/images/banner-mobile-0.png",
    desktopPosition: "center 15%",
    mobilePosition: "center top",
  },
  {
    desktop: "/images/banner-slide-2.png",
    mobile: "/images/banner-1-mobile.png",
    desktopPosition: "center 15%",
    mobilePosition: "center top",
  },
];

const SLIDE_INTERVAL = 5000;

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-screen bg-[#000000] overflow-hidden">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={index}
          className="absolute inset-0 z-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: index === currentSlide ? 1 : 0 }}
        >
          {/* Desktop Image */}
          <div className="hidden md:block w-full h-full relative">
            <Image
              src={slide.desktop}
              alt="Hero Banner Desktop"
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: slide.desktopPosition }}
              priority={index === 0}
              quality={90}
            />
          </div>
          {/* Mobile Image */}
          <div className="block md:hidden w-full h-full relative">
            {/* Blurred background image to fill any gaps (eliminates black gaps) */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src={slide.mobile}
                alt="Hero Banner Mobile Background"
                fill
                sizes="100vw"
                className="object-cover blur-[20px] scale-110 opacity-50"
                priority={index === 0}
                quality={30}
              />
            </div>
            {/* Fully viewable sharp foreground image container, positioned below the navbar */}
            <div className="absolute inset-x-0 top-[96px] bottom-0 z-10 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={slide.mobile}
                  alt="Hero Banner Mobile"
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority={index === 0}
                  quality={90}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-500 rounded-full ${
              index === currentSlide
                ? "w-8 bg-[#C8A85C] shadow-[0_0_8px_rgba(200,168,92,0.4)]"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
