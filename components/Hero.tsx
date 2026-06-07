'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const HERO_IMAGES = [
  "/images/heronew.png",
  "/images/heroback.png"
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // Rotate every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Images Slider */}
      {HERO_IMAGES.map((src, index) => (
        <div 
          key={src}
          className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === currentSlide ? 1 : 0 }}
        >
          <Image
            src={src}
            alt="Luxury Streetwear Models"
            fill
            className="object-cover object-center scale-105"
            priority={index === 0}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-x-0 bottom-32 z-10 text-center px-4 w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 animate-fade-in">
        <Link
          href="/catalog"
          className="bg-luxury-gold text-black px-12 py-4 text-xs md:text-sm font-bold tracking-[0.2em] uppercase hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          SHOP NOW
        </Link>
        <span className="text-[10px] hover:text-white transition-colors cursor-default text-white/50 tracking-[0.3em] uppercase italic">
          Inspired by Kerala Heritage
        </span>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-500 rounded-full ${
              index === currentSlide ? "w-8 bg-luxury-gold" : "w-2 bg-white/50 hover:bg-white"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="w-[1px] h-10 bg-gradient-to-b from-white to-transparent" />
      </div>
    </section>
  );
}
