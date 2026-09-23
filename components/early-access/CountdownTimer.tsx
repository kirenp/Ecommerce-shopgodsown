'use client';

import { useState, useEffect, memo } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Default fallback offset matching reference preview (3 days, 18 hours, 45 mins, 27 secs)
const DEFAULT_OFFSET_MS = (3 * 86400 + 18 * 3600 + 45 * 60 + 27) * 1000;

function parseLaunchDate(dateStr?: string): number | null {
  if (!dateStr || !dateStr.trim()) return null;
  const cleanStr = dateStr.trim().replace(/^["']|["']$/g, '');
  
  // Direct Date parse (supports ISO "2026-10-01T00:00:00", "2026-10-01", etc.)
  const parsed = new Date(cleanStr).getTime();
  if (!isNaN(parsed)) return parsed;

  // Try replacing spaces with 'T' (e.g., "2026-10-01 18:00:00")
  const isoTry = new Date(cleanStr.replace(' ', 'T')).getTime();
  if (!isNaN(isoTry)) return isoTry;

  // Try numerical epoch timestamp
  const num = Number(cleanStr);
  if (!isNaN(num) && num > 1000000000) return num;

  return null;
}

function getEnvDurationMs(): number {
  const d = parseInt(process.env.NEXT_PUBLIC_COUNTDOWN_DAYS || '', 10);
  const h = parseInt(process.env.NEXT_PUBLIC_COUNTDOWN_HOURS || '', 10);
  const m = parseInt(process.env.NEXT_PUBLIC_COUNTDOWN_MINUTES || '', 10);
  const s = parseInt(process.env.NEXT_PUBLIC_COUNTDOWN_SECONDS || '', 10);

  const hasConfig = !isNaN(d) || !isNaN(h) || !isNaN(m) || !isNaN(s);
  if (hasConfig) {
    const days = isNaN(d) ? 0 : d;
    const hours = isNaN(h) ? 0 : h;
    const minutes = isNaN(m) ? 0 : m;
    const seconds = isNaN(s) ? 0 : s;
    return (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  return DEFAULT_OFFSET_MS;
}

function getTargetTimestamp(): number {
  // 1. Primary: If explicit target date is provided in env, always respect it
  const envDate = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  const parsedDate = parseLaunchDate(envDate);
  if (parsedDate !== null) {
    return parsedDate;
  }

  if (typeof window === 'undefined') {
    return Date.now() + DEFAULT_OFFSET_MS;
  }

  // 2. Relative duration mode (configured via env or default)
  const durationMs = getEnvDurationMs();
  const storageKey = `godsown_launch_target_${durationMs}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > Date.now()) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  const target = Date.now() + durationMs;
  try {
    localStorage.setItem(storageKey, target.toString());
  } catch {
    // Ignore localStorage errors
  }
  return target;
}

function calculateTimeLeft(targetTimestamp: number): TimeLeft {
  const diff = Math.max(0, targetTimestamp - Date.now());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

// Single Split-Flap Card Component
interface FlipCardProps {
  value: number;
  label: string;
}

const FlipCard = memo(function FlipCard({ value, label }: FlipCardProps) {
  const formattedValue = String(value).padStart(2, '0');
  const [currentVal, setCurrentVal] = useState(formattedValue);
  const [nextVal, setNextVal] = useState(formattedValue);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (formattedValue !== currentVal) {
      setNextVal(formattedValue);
      setIsFlipping(true);
      setFlipKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setCurrentVal(formattedValue);
        setIsFlipping(false);
      }, 580);

      return () => clearTimeout(timer);
    }
  }, [formattedValue, currentVal]);

  return (
    <div className="flex flex-col items-center">
      {/* ── Flip Card Container ── */}
      <div 
        className="relative w-[72px] h-[80px] xs:w-[78px] xs:h-[86px] sm:w-[86px] sm:h-[94px] md:w-[92px] md:h-[100px] rounded-[15px] sm:rounded-[18px] select-none flex items-center justify-center"
        style={{
          background: '#151518',
          boxShadow: `
            0 14px 32px -4px rgba(0, 0, 0, 0.85),
            0 6px 14px -2px rgba(0, 0, 0, 0.65),
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            inset 0 -1px 2px rgba(0, 0, 0, 0.9)
          `,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          perspective: '700px',
        }}
      >
        {/* ── 1. STATIC BACKGROUND TOP HALF (Reveals Next Value) ── */}
        <div 
          className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[14px] sm:rounded-t-[17px] z-0"
          style={{
            background: 'linear-gradient(180deg, #1d1d21 0%, #17171a 100%)',
            borderBottom: '0.5px solid #09090b',
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 65%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-[80px] xs:h-[86px] sm:h-[94px] md:h-[100px] flex items-center justify-center">
            <span
              className="text-white font-extrabold leading-none select-none text-[40px] xs:text-[45px] sm:text-[50px] md:text-[54px] tracking-tight"
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              {isFlipping ? nextVal : currentVal}
            </span>
          </div>
        </div>

        {/* ── 2. STATIC BACKGROUND BOTTOM HALF (Shows Old Value until New Flap Covers it) ── */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[14px] sm:rounded-b-[17px] z-0"
          style={{
            background: 'linear-gradient(180deg, #131316 0%, #17171a 100%)',
            borderTop: '0.5px solid #060608',
          }}
        >
          <div 
            className="absolute inset-x-0 top-0 h-4 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-[80px] xs:h-[86px] sm:h-[94px] md:h-[100px] flex items-center justify-center">
            <span
              className="text-white font-extrabold leading-none select-none text-[40px] xs:text-[45px] sm:text-[50px] md:text-[54px] tracking-tight"
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              {currentVal}
            </span>
          </div>
        </div>

        {/* ── 3. FLIPPING TOP FLAP (Shows Old Value, Flips Down 0deg to -90deg) ── */}
        {isFlipping && (
          <div 
            key={`top-${flipKey}`}
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[14px] sm:rounded-t-[17px] z-20 ea-flap-top"
            style={{
              background: 'linear-gradient(180deg, #1d1d21 0%, #17171a 100%)',
              borderBottom: '0.5px solid #09090b',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[80px] xs:h-[86px] sm:h-[94px] md:h-[100px] flex items-center justify-center">
              <span
                className="text-white font-extrabold leading-none select-none text-[40px] xs:text-[45px] sm:text-[50px] md:text-[54px] tracking-tight"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                {currentVal}
              </span>
            </div>
            {/* Shading shadow as leaf tilts down away from light */}
            <div className="absolute inset-0 bg-black pointer-events-none ea-shadow-in" />
          </div>
        )}

        {/* ── 4. FLIPPING BOTTOM FLAP (Shows New Value, Unfolds Down 90deg to 0deg) ── */}
        {isFlipping && (
          <div 
            key={`bot-${flipKey}`}
            className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[14px] sm:rounded-b-[17px] z-20 ea-flap-bottom"
            style={{
              background: 'linear-gradient(180deg, #131316 0%, #17171a 100%)',
              borderTop: '0.5px solid #060608',
            }}
          >
            <div className="absolute inset-x-0 bottom-0 h-[80px] xs:h-[86px] sm:h-[94px] md:h-[100px] flex items-center justify-center">
              <span
                className="text-white font-extrabold leading-none select-none text-[40px] xs:text-[45px] sm:text-[50px] md:text-[54px] tracking-tight"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                {nextVal}
              </span>
            </div>
            {/* Shadow fades out as flap lands into place */}
            <div className="absolute inset-0 bg-black pointer-events-none ea-shadow-out" />
          </div>
        )}

        {/* ── Center Slit / Seam Line ── */}
        <div 
          className="absolute inset-x-0 top-1/2 -translate-y-[0.75px] h-[1.5px] z-30 pointer-events-none"
          style={{
            background: '#0a0a0d',
            boxShadow: '0 1px 0 rgba(255, 255, 255, 0.04), 0 -1px 0 rgba(0, 0, 0, 0.95)',
          }}
        />

        {/* ── Left Mechanical Side Hinge / Clip (Metallic Red) ── */}
        <div 
          className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 w-[5.5px] sm:w-[6px] h-[16px] sm:h-[18px] rounded-[2.5px] z-40 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #6B080F 0%, #B8111E 28%, #FF5260 50%, #9E0E19 72%, #4A0408 100%)',
            boxShadow: `
              0 0 8px rgba(193, 18, 31, 0.55),
              0 1.5px 3.5px rgba(0,0,0,0.9),
              inset 0 1px 0.5px rgba(255, 205, 210, 0.9),
              inset 0 -1px 0.5px rgba(35, 1, 4, 0.95)
            `,
            border: '0.5px solid rgba(255, 75, 90, 0.4)',
          }}
        >
          {/* Center hinge seam rivet groove */}
          <div 
            className="absolute inset-x-[0.5px] top-1/2 -translate-y-[0.5px] h-[1px]"
            style={{ 
              background: 'rgba(30, 2, 5, 0.95)',
              boxShadow: '0 0.5px 0.5px rgba(255, 120, 130, 0.5)'
            }}
          />
        </div>

        {/* ── Right Mechanical Side Hinge / Clip (Metallic Red) ── */}
        <div 
          className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[5.5px] sm:w-[6px] h-[16px] sm:h-[18px] rounded-[2.5px] z-40 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #6B080F 0%, #B8111E 28%, #FF5260 50%, #9E0E19 72%, #4A0408 100%)',
            boxShadow: `
              0 0 8px rgba(193, 18, 31, 0.55),
              0 1.5px 3.5px rgba(0,0,0,0.9),
              inset 0 1px 0.5px rgba(255, 205, 210, 0.9),
              inset 0 -1px 0.5px rgba(35, 1, 4, 0.95)
            `,
            border: '0.5px solid rgba(255, 75, 90, 0.4)',
          }}
        >
          {/* Center hinge seam rivet groove */}
          <div 
            className="absolute inset-x-[0.5px] top-1/2 -translate-y-[0.5px] h-[1px]"
            style={{ 
              background: 'rgba(30, 2, 5, 0.95)',
              boxShadow: '0 0.5px 0.5px rgba(255, 120, 130, 0.5)'
            }}
          />
        </div>
      </div>

      {/* ── Label Below Each Card ── */}
      <span 
        className="mt-3.5 text-[11px] sm:text-[12px] md:text-[13px] font-semibold tracking-[0.22em] uppercase select-none text-center"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#9CA3AF',
        }}
      >
        {label}
      </span>
    </div>
  );
});

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 3,
    hours: 18,
    minutes: 45,
    seconds: 27,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const target = getTargetTimestamp();
    setTimeLeft(calculateTimeLeft(target));

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="flex flex-col items-center select-none"
      style={{
        animation: 'eaFadeSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flipTopLeaf {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-90deg);
          }
        }

        @keyframes flipBottomLeaf {
          0% {
            transform: rotateX(90deg);
          }
          100% {
            transform: rotateX(0deg);
          }
        }

        @keyframes flipShadowIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.65;
          }
        }

        @keyframes flipShadowOut {
          0% {
            opacity: 0.65;
          }
          100% {
            opacity: 0;
          }
        }

        .ea-flap-top {
          animation: flipTopLeaf 0.28s cubic-bezier(0.37, 0, 0.63, 1) forwards !important;
          transform-origin: bottom center !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          transform-style: preserve-3d !important;
          will-change: transform !important;
        }

        .ea-flap-bottom {
          animation: flipBottomLeaf 0.28s cubic-bezier(0.15, 0.9, 0.34, 1) 0.26s forwards !important;
          transform-origin: top center !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          transform-style: preserve-3d !important;
          transform: rotateX(90deg);
          will-change: transform !important;
        }

        .ea-shadow-in {
          animation: flipShadowIn 0.28s ease-in forwards !important;
        }

        .ea-shadow-out {
          animation: flipShadowOut 0.28s ease-out 0.26s forwards !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .ea-flap-top {
            animation-duration: 0.28s !important;
          }
          .ea-flap-bottom {
            animation-duration: 0.28s !important;
            animation-delay: 0.26s !important;
          }
          .ea-shadow-in {
            animation-duration: 0.28s !important;
          }
          .ea-shadow-out {
            animation-duration: 0.28s !important;
            animation-delay: 0.26s !important;
          }
        }
      `}} />

      {/* ── 4 Countdown Flip Cards ── */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
        <FlipCard value={isClient ? timeLeft.days : 3} label="DAYS" />
        <FlipCard value={isClient ? timeLeft.hours : 18} label="HOURS" />
        <FlipCard value={isClient ? timeLeft.minutes : 45} label="MINUTES" />
        <FlipCard value={isClient ? timeLeft.seconds : 27} label="SECONDS" />
      </div>
    </div>
  );
}
