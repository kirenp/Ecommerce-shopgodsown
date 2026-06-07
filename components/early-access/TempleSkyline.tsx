'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Palm tree silhouette SVG
function PalmTree({ x, height, delay }: { x: number; height: number; delay: number }) {
  const treeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!treeRef.current) return;

    gsap.set(treeRef.current, { y: 100, opacity: 0 });

    gsap.to(treeRef.current, {
      y: 0,
      opacity: 1,
      duration: 3,
      delay,
      ease: 'power2.out',
    });

    // Subtle sway
    gsap.to(treeRef.current, {
      rotation: 2,
      duration: 4 + Math.random() * 2,
      delay: delay + 3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      transformOrigin: 'center bottom',
    });
  }, [delay]);

  return (
    <g ref={treeRef} transform={`translate(${x}, 0)`}>
      {/* Trunk */}
      <path
        d={`M0 ${400 - height} C5 ${400 - height + 30} -3 ${400 - height + 80} 2 400`}
        stroke="#1A1008"
        strokeWidth="6"
        fill="none"
      />
      {/* Fronds */}
      {[-40, -20, 0, 20, 40].map((angle, i) => (
        <path
          key={i}
          d={`M0 ${400 - height} C${angle * 1.5} ${400 - height - 20} ${angle * 2} ${400 - height - 10} ${angle * 2.5} ${400 - height + 15}`}
          stroke="#1A1008"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
      ))}
      {/* Additional leaf detail */}
      {[-30, -10, 10, 30].map((angle, i) => (
        <path
          key={`leaf-${i}`}
          d={`M0 ${400 - height} C${angle} ${400 - height - 15} ${angle * 1.8} ${400 - height - 5} ${angle * 2} ${400 - height + 20}`}
          stroke="#1A1008"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
      ))}
    </g>
  );
}

// Temple tower silhouette
function TempleTower({ x, scale, delay }: { x: number; scale: number; delay: number }) {
  const towerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!towerRef.current) return;

    gsap.set(towerRef.current, { y: 150, opacity: 0 });

    gsap.to(towerRef.current, {
      y: 0,
      opacity: 0.6,
      duration: 4,
      delay,
      ease: 'power2.out',
    });
  }, [delay]);

  return (
    <g ref={towerRef} transform={`translate(${x}, 0) scale(${scale})`}>
      {/* Base */}
      <rect x="-20" y="300" width="40" height="100" fill="#1A1008" />
      {/* Tiers */}
      <rect x="-25" y="290" width="50" height="15" fill="#1A1008" />
      <rect x="-22" y="270" width="44" height="25" fill="#1A1008" />
      <rect x="-18" y="250" width="36" height="25" fill="#1A1008" />
      <rect x="-14" y="230" width="28" height="25" fill="#1A1008" />
      {/* Gopuram top */}
      <path d="M-14 230 L0 200 L14 230" fill="#1A1008" />
      {/* Kalasham */}
      <circle cx="0" cy="198" r="4" fill="#2B1D14" />
      {/* Window details */}
      {[265, 285, 310, 340].map((y, i) => (
        <rect key={i} x="-5" y={y} width="10" height="8" rx="2" fill="#0D0906" opacity="0.5" />
      ))}
    </g>
  );
}

// Lighthouse silhouette (as seen in reference)
function Lighthouse({ x, delay }: { x: number; delay: number }) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.set(ref.current, { y: 120, opacity: 0 });

    gsap.to(ref.current, {
      y: 0,
      opacity: 0.5,
      duration: 3.5,
      delay,
      ease: 'power2.out',
    });
  }, [delay]);

  return (
    <g ref={ref} transform={`translate(${x}, 0)`}>
      <path d="M-8 400 L-5 250 L5 250 L8 400" fill="#1A1008" />
      <rect x="-8" y="245" width="16" height="10" fill="#1A1008" />
      <circle cx="0" cy="242" r="6" fill="#2B1D14" />
      {/* Light glow */}
      <circle cx="0" cy="242" r="4" fill="#D4AF37" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export default function TempleSkyline() {
  const skyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!skyRef.current) return;

    gsap.set(skyRef.current, { opacity: 0 });

    gsap.to(skyRef.current, {
      opacity: 1,
      duration: 4,
      delay: 10,
      ease: 'power2.inOut',
    });
  }, []);

  return (
    <div ref={skyRef} className="absolute inset-0 z-[2] pointer-events-none opacity-0">
      {/* Sunset sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            #0D0906 0%,
            #1A1008 15%,
            #2B1D14 30%,
            #5A3A1A 45%,
            #8D5C2D 55%,
            #D4AF37 65%,
            #E89C3D 72%,
            #D4AF37 80%,
            #8D5C2D 88%,
            #2B1D14 95%,
            #120D08 100%
          )`,
          opacity: 0.6,
        }}
      />

      {/* Cloud/haze layer */}
      <div
        className="absolute w-full"
        style={{
          top: '30%',
          height: '30%',
          background: 'linear-gradient(to bottom, transparent, rgba(232,156,61,0.08) 50%, transparent)',
        }}
      />

      {/* Silhouette layer */}
      <svg
        viewBox="0 0 1000 400"
        fill="none"
        className="absolute bottom-0 w-full h-[60%]"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Temple towers */}
        <TempleTower x={80} scale={0.8} delay={11} />
        <TempleTower x={180} scale={0.6} delay={12} />
        <TempleTower x={820} scale={0.7} delay={11.5} />
        <TempleTower x={920} scale={0.9} delay={12.5} />

        {/* Palm trees */}
        <PalmTree x={50} height={200} delay={11} />
        <PalmTree x={150} height={180} delay={11.5} />
        <PalmTree x={250} height={160} delay={12} />
        <PalmTree x={750} height={170} delay={11.3} />
        <PalmTree x={850} height={190} delay={11.8} />
        <PalmTree x={950} height={210} delay={12.2} />

        {/* Lighthouse */}
        <Lighthouse x={900} delay={12} />

        {/* Ground */}
        <rect x="0" y="390" width="1000" height="20" fill="#120D08" />
      </svg>

      {/* Atmospheric haze layers */}
      <div
        className="absolute bottom-0 left-0 w-full h-[40%]"
        style={{
          background: 'linear-gradient(to top, #120D08 0%, rgba(18,13,8,0.8) 30%, transparent 100%)',
        }}
      />

      {/* Volumetric fog strips */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute w-[120%] -left-[10%]"
          style={{
            bottom: `${15 + i * 12}%`,
            height: '8%',
            background: `linear-gradient(90deg, transparent 0%, rgba(232,156,61,${0.02 * i}) 30%, rgba(212,175,55,${0.03 * i}) 50%, rgba(232,156,61,${0.02 * i}) 70%, transparent 100%)`,
            animation: `float ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}
