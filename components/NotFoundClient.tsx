'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   God's Own Culture — 404 Page Not Found
   Authentic Chrome Dino running animation with the exact custom
   retro pixel art "404", falling asteroids/meteors, ground lines,
   and "Page not found" typography matching the design.
   ────────────────────────────────────────────────────────────── */

export default function NotFoundClient() {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [isJumping, setIsJumping] = useState(false);

  // Cadence: ~140ms per step creates a natural, authentic running stride
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 140);

    return () => clearInterval(timer);
  }, []);

  // Easter egg: spacebar or tap jumps the dino
  const handleJump = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
    }, 550);
  }, [isJumping]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleJump]);

  return (
    <main className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center relative overflow-hidden select-none px-4 py-12">
      {/* Background grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl w-full mx-auto text-center">
        {/* ─── 404 GRAPHIC + RUNNING DINO ANIMATION ─── */}
        <div
          onClick={handleJump}
          title="Click or press Spacebar to jump"
          className="relative w-full max-w-[460px] sm:max-w-[500px] md:max-w-[540px] aspect-[495/307] cursor-pointer mb-6 group transition-transform duration-300 hover:scale-[1.02]"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Dinosaur container with jump animation */}
          <div
            className={`w-full h-full relative transition-transform ${
              isJumping ? '-translate-y-8 duration-250 ease-out' : 'translate-y-0 duration-300 ease-in'
            }`}
          >
            {/* Frame 1 */}
            <div
              className={`absolute inset-0 transition-opacity duration-0 ${
                frame === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src="/images/404-dino-frame1.png"
                alt="404 Page Not Found - Chrome Dino Running Frame 1"
                fill
                priority
                sizes="(max-width: 640px) 460px, (max-width: 768px) 500px, 540px"
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Frame 2 */}
            <div
              className={`absolute inset-0 transition-opacity duration-0 ${
                frame === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src="/images/404-dino-frame2.png"
                alt="404 Page Not Found - Chrome Dino Running Frame 2"
                fill
                priority
                sizes="(max-width: 640px) 460px, (max-width: 768px) 500px, 540px"
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        </div>

        {/* ─── SUBTEXT ─── */}
        <p className="text-black/60 text-xs sm:text-sm tracking-wide max-w-sm mx-auto mb-8 leading-relaxed font-sans">
          The page you&apos;re looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
        </p>

        {/* ─── ACTION BUTTONS ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/catalog"
            className="w-full sm:w-auto bg-black text-white hover:bg-[#C81E1E] text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] px-8 py-3.5 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm hover:shadow group"
          >
            <ShoppingBag size={14} className="group-hover:scale-110 transition-transform duration-200" />
            <span>Shop Collection</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto bg-transparent text-black border border-black/25 hover:border-black text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] px-8 py-3.5 transition-all duration-300 flex items-center justify-center gap-2.5 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Subtle keyboard hint */}
        <p className="mt-8 text-[10px] text-black/30 tracking-widest uppercase font-mono hidden sm:block">
          Press Spacebar or Click Dino to Jump
        </p>
      </div>
    </main>
  );
}
