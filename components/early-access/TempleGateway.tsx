'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Kerala temple motif patterns for relief carving
function TempleRelief() {
  return (
    <g opacity="0.6">
      {/* Row of small carved figures — temple procession */}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 155 + i * 29;
        const y = 250;
        return (
          <g key={`figure-${i}`}>
            {/* Standing figure */}
            <circle cx={x} cy={y - 15} r="3" fill="#8D5C2D" />
            <line x1={x} y1={y - 12} x2={x} y2={y} stroke="#8D5C2D" strokeWidth="1.5" />
            <line x1={x - 3} y1={y - 6} x2={x + 3} y2={y - 6} stroke="#8D5C2D" strokeWidth="1" />
            <line x1={x} y1={y} x2={x - 2} y2={y + 6} stroke="#8D5C2D" strokeWidth="1" />
            <line x1={x} y1={y} x2={x + 2} y2={y + 6} stroke="#8D5C2D" strokeWidth="1" />
          </g>
        );
      })}

      {/* Snake boat scene — chundan vallam */}
      <g transform="translate(200, 290)">
        <path
          d="M-60 10 C-40 20 -20 22 0 22 C20 22 40 20 60 10 C65 8 68 5 70 0 L-70 0 C-68 5 -65 8 -60 10Z"
          fill="none"
          stroke="#8D5C2D"
          strokeWidth="1.5"
        />
        {/* Rowers */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`rower-${i}`}
            x1={-50 + i * 13}
            y1={-2}
            x2={-50 + i * 13}
            y2={8}
            stroke="#8D5C2D"
            strokeWidth="1"
          />
        ))}
        {/* Stern ornament */}
        <path d="M-70 0 C-75 -10 -72 -20 -65 -25" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
      </g>

      {/* Small temple silhouettes in middle band */}
      {[180, 260, 340].map((x, i) => (
        <g key={`temple-${i}`} transform={`translate(${x}, 200)`}>
          <rect x="-8" y="0" width="16" height="20" fill="none" stroke="#8D5C2D" strokeWidth="1" />
          <path d="M-10 0 L0 -12 L10 0" fill="none" stroke="#8D5C2D" strokeWidth="1" />
          <path d="M-6 -12 L0 -20 L6 -12" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
          <rect x="-3" y="10" width="6" height="10" fill="none" stroke="#8D5C2D" strokeWidth="0.8" />
        </g>
      ))}

      {/* Kathakali face motif */}
      <g transform="translate(250, 340)">
        <ellipse cx="0" cy="0" rx="18" ry="22" fill="none" stroke="#8D5C2D" strokeWidth="1.5" />
        {/* Crown */}
        <path d="M-18 -10 C-20 -25 -10 -35 0 -38 C10 -35 20 -25 18 -10" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        {/* Eyes */}
        <ellipse cx="-6" cy="-4" rx="4" ry="2.5" fill="none" stroke="#8D5C2D" strokeWidth="1" />
        <ellipse cx="6" cy="-4" rx="4" ry="2.5" fill="none" stroke="#8D5C2D" strokeWidth="1" />
        {/* Nose */}
        <path d="M0 0 L-2 5 L2 5" fill="none" stroke="#8D5C2D" strokeWidth="0.8" />
        {/* Decorative chin */}
        <path d="M-12 10 C-8 18 8 18 12 10" fill="none" stroke="#D4AF37" strokeWidth="1" />
      </g>

      {/* Decorative lotus border patterns */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const r = 155;
        const cx = 250 + Math.cos(angle) * r;
        const cy = 260 + Math.sin(angle) * r;
        return (
          <g key={`lotus-${i}`} transform={`translate(${cx}, ${cy}) rotate(${(angle * 180) / Math.PI + 90})`}>
            <path
              d="M0 -6 C3 -3 3 0 0 4 C-3 0 -3 -3 0 -6"
              fill="#D4AF37"
              opacity="0.5"
            />
          </g>
        );
      })}
    </g>
  );
}

// Gopuram (temple tower) crown on top of the medallion
function GopuramCrown() {
  return (
    <g>
      {/* Main gopuram structure */}
      <path
        d="M200 105 L215 60 L225 70 L235 40 L245 55 L250 25 L255 55 L265 40 L275 70 L285 60 L300 105"
        fill="url(#stoneGradient)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      {/* Gopuram tiers */}
      <rect x="210" y="85" width="80" height="8" rx="1" fill="url(#goldBand)" />
      <rect x="218" y="68" width="64" height="6" rx="1" fill="url(#goldBand)" />
      <rect x="228" y="50" width="44" height="5" rx="1" fill="url(#goldBand)" />
      {/* Kalasham (pinnacle) */}
      <circle cx="250" cy="22" r="5" fill="#D4AF37" />
      <path d="M247 17 L250 8 L253 17" fill="#D4AF37" />
      {/* Small deity niches */}
      {[225, 250, 275].map((x, i) => (
        <g key={`niche-${i}`}>
          <rect x={x - 4} y="90" width="8" height="10" rx="1" fill="#2B1D14" opacity="0.5" />
          <path d={`M${x - 5} 90 L${x} 84 L${x + 5} 90`} fill="#D4AF37" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

export default function TempleGateway() {
  const gatewayRef = useRef<HTMLDivElement>(null);
  const textGlowRef = useRef<SVGGElement>(null);
  const crackLightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gatewayRef.current) return;

    const el = gatewayRef.current;

    // Start below screen, invisible
    gsap.set(el, { y: '100%', opacity: 0 });

    const tl = gsap.timeline();

    // Ground crack light burst (8s)
    if (crackLightRef.current) {
      tl.fromTo(
        crackLightRef.current,
        { opacity: 0, scaleY: 0 },
        { opacity: 1, scaleY: 1, duration: 1.5, ease: 'power2.out' },
        8
      );
    }

    // Gateway rises from ground (9s-14s)
    tl.to(
      el,
      {
        y: '0%',
        opacity: 1,
        duration: 5,
        ease: 'power3.out',
      },
      9
    );

    // Stone tremor as it emerges
    tl.to(
      el,
      {
        x: '+=2',
        duration: 0.1,
        repeat: 20,
        yoyo: true,
        ease: 'none',
      },
      9
    );

    return () => {
      tl.kill();
    };
  }, []);

  // Text glow animation
  useEffect(() => {
    if (!textGlowRef.current) return;

    gsap.fromTo(
      textGlowRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 2,
        delay: 14,
        ease: 'power2.inOut',
      }
    );

    // Continuous gentle glow pulse
    gsap.to(textGlowRef.current, {
      opacity: 0.7,
      duration: 3,
      delay: 16,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }, []);

  return (
    <>
      {/* Golden light erupting from below */}
      <div
        ref={crackLightRef}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[80%] z-[5] pointer-events-none opacity-0"
        style={{
          background:
            'radial-gradient(ellipse at center bottom, rgba(212,175,55,0.3) 0%, rgba(232,156,61,0.1) 30%, transparent 70%)',
          transformOrigin: 'center bottom',
        }}
      />

      {/* Main Gateway */}
      <div
        ref={gatewayRef}
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[55%] md:w-[40%] lg:w-[35%] z-[8]"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.2))',
        }}
      >
        <svg
          viewBox="0 0 500 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* ══════ DEFINITIONS ══════ */}
          <defs>
            <linearGradient id="stoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5A4A3A" />
              <stop offset="40%" stopColor="#3D3028" />
              <stop offset="100%" stopColor="#2B1D14" />
            </linearGradient>
            <linearGradient id="goldBand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8D5C2D" />
              <stop offset="30%" stopColor="#D4AF37" />
              <stop offset="70%" stopColor="#E89C3D" />
              <stop offset="100%" stopColor="#8D5C2D" />
            </linearGradient>
            <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="stoneTexture">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feComposite in="SourceGraphic" in2="noise" operator="in" />
              <feBlend in="SourceGraphic" in2="result" mode="multiply" />
            </filter>
            {/* Text styling */}
            <filter id="goldEmboss">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feOffset in="blur" dx="1" dy="1" result="offset" />
              <feComposite in="SourceGraphic" in2="offset" operator="over" />
            </filter>
          </defs>

          {/* ══════ GOPURAM CROWN ══════ */}
          <GopuramCrown />

          {/* ══════ MAIN CIRCULAR MEDALLION ══════ */}

          {/* Outer ring */}
          <circle
            cx="250"
            cy="280"
            r="175"
            fill="none"
            stroke="url(#goldBand)"
            strokeWidth="8"
          />

          {/* Stone fill */}
          <circle
            cx="250"
            cy="280"
            r="170"
            fill="url(#stoneGradient)"
          />

          {/* Inner glow */}
          <circle
            cx="250"
            cy="280"
            r="165"
            fill="url(#innerGlow)"
          />

          {/* Decorative inner ring */}
          <circle
            cx="250"
            cy="280"
            r="158"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <circle
            cx="250"
            cy="280"
            r="148"
            fill="none"
            stroke="#8D5C2D"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* ══════ CARVED RELIEF ARTWORK ══════ */}
          <TempleRelief />

          {/* ══════ TEXT — "WELCOME TO" ══════ */}
          <text
            x="250"
            y="175"
            textAnchor="middle"
            fill="#D4AF37"
            fontSize="14"
            fontFamily="serif"
            letterSpacing="8"
            opacity="0.8"
          >
            WELCOME TO
          </text>

          {/* ══════ TEXT — "GOD'S OWN CULTURE" ══════ */}
          <g ref={textGlowRef} opacity="0">
            {/* Shadow layer */}
            <text
              x="250"
              y="285"
              textAnchor="middle"
              fill="#2B1D14"
              fontSize="42"
              fontFamily="serif"
              fontWeight="700"
              letterSpacing="3"
            >
              GOD&apos;S OWN
            </text>
            {/* Gold layer */}
            <text
              x="250"
              y="285"
              textAnchor="middle"
              fill="url(#goldBand)"
              fontSize="42"
              fontFamily="serif"
              fontWeight="700"
              letterSpacing="3"
              filter="url(#goldEmboss)"
            >
              GOD&apos;S OWN
            </text>
            {/* CULTURE text */}
            <text
              x="250"
              y="340"
              textAnchor="middle"
              fill="#2B1D14"
              fontSize="48"
              fontFamily="serif"
              fontWeight="700"
              letterSpacing="6"
            >
              CULTURE
            </text>
            <text
              x="250"
              y="340"
              textAnchor="middle"
              fill="url(#goldBand)"
              fontSize="48"
              fontFamily="serif"
              fontWeight="700"
              letterSpacing="6"
              filter="url(#goldEmboss)"
            >
              CULTURE
            </text>
          </g>

          {/* ══════ STONE PILLARS ══════ */}
          {/* Left pillar */}
          <rect x="55" y="130" width="35" height="370" fill="url(#stoneGradient)" />
          <rect x="55" y="130" width="35" height="8" fill="url(#goldBand)" />
          <rect x="55" y="492" width="35" height="8" fill="url(#goldBand)" />
          {/* Pillar carvings */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={`left-carving-${i}`}
              x="60"
              y={155 + i * 55}
              width="25"
              height="35"
              rx="2"
              fill="none"
              stroke="#8D5C2D"
              strokeWidth="0.8"
              opacity="0.4"
            />
          ))}

          {/* Right pillar */}
          <rect x="410" y="130" width="35" height="370" fill="url(#stoneGradient)" />
          <rect x="410" y="130" width="35" height="8" fill="url(#goldBand)" />
          <rect x="410" y="492" width="35" height="8" fill="url(#goldBand)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={`right-carving-${i}`}
              x="415"
              y={155 + i * 55}
              width="25"
              height="35"
              rx="2"
              fill="none"
              stroke="#8D5C2D"
              strokeWidth="0.8"
              opacity="0.4"
            />
          ))}

          {/* ══════ STONE STEPS ══════ */}
          <rect x="70" y="500" width="360" height="8" fill="#3D3028" />
          <rect x="55" y="508" width="390" height="8" fill="#342A20" />
          <rect x="40" y="516" width="420" height="6" fill="#2B1D14" />

          {/* ══════ OIL LAMPS (DIYAS) ══════ */}
          {[100, 400].map((x, i) => (
            <g key={`diya-${i}`}>
              {/* Lamp base */}
              <ellipse cx={x} cy="498" rx="8" ry="3" fill="#8D5C2D" />
              <path d={`M${x - 5} 498 L${x - 3} 490 L${x + 3} 490 L${x + 5} 498`} fill="#8D5C2D" />
              {/* Flame */}
              <ellipse cx={x} cy="484" rx="3" ry="6" fill="#E89C3D" opacity="0.8">
                <animate attributeName="ry" values="6;7;5;6" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;1;0.7;0.8" dur="2s" repeatCount="indefinite" />
              </ellipse>
              {/* Flame glow */}
              <circle cx={x} cy="484" r="10" fill="#D4AF37" opacity="0.15">
                <animate attributeName="r" values="10;13;10" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}
