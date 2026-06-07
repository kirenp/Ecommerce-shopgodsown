'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function GroundCrack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const crackSvgRef = useRef<SVGSVGElement>(null);
  const debrisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!crackSvgRef.current || !debrisRef.current) return;

    const paths = crackSvgRef.current.querySelectorAll('.crack-line');
    const glowPaths = crackSvgRef.current.querySelectorAll('.crack-glow');

    // Set initial state
    paths.forEach((path) => {
      const el = path as SVGPathElement;
      const length = el.getTotalLength();
      gsap.set(el, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });

    gsap.set(glowPaths, { opacity: 0 });

    const tl = gsap.timeline();

    // Cracks appear at 8s
    paths.forEach((path, i) => {
      tl.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.inOut',
        },
        8 + i * 0.2
      );
    });

    // Golden glow from cracks
    tl.to(
      glowPaths,
      {
        opacity: 0.8,
        duration: 1,
        stagger: 0.1,
        ease: 'power2.out',
      },
      8.5
    );

    // Debris particles
    const createDebris = () => {
      if (!debrisRef.current) return;
      for (let i = 0; i < 30; i++) {
        const debris = document.createElement('div');
        const size = Math.random() * 8 + 2;
        debris.style.position = 'absolute';
        debris.style.width = `${size}px`;
        debris.style.height = `${size}px`;
        debris.style.backgroundColor = `hsl(${30 + Math.random() * 15}, ${40 + Math.random() * 20}%, ${25 + Math.random() * 20}%)`;
        debris.style.left = `${40 + Math.random() * 20}%`;
        debris.style.bottom = '0';
        debris.style.borderRadius = `${Math.random() * 30}%`;
        debrisRef.current.appendChild(debris);

        gsap.to(debris, {
          y: -(Math.random() * 200 + 100),
          x: (Math.random() - 0.5) * 150,
          rotation: Math.random() * 720,
          opacity: 0,
          duration: 2 + Math.random() * 1.5,
          ease: 'power2.out',
          onComplete: () => debris.remove(),
        });
      }
    };

    // Trigger debris at 8.5s
    const debrisTimeout = setTimeout(createDebris, 8500);

    // Camera shake effect
    if (containerRef.current) {
      tl.to(
        containerRef.current,
        {
          x: '+=3',
          duration: 0.05,
          repeat: 30,
          yoyo: true,
          ease: 'none',
        },
        8
      );
    }

    return () => {
      tl.kill();
      clearTimeout(debrisTimeout);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute bottom-0 left-0 w-full h-[30%] z-[6] pointer-events-none">
      {/* Crack SVG overlay */}
      <svg
        ref={crackSvgRef}
        viewBox="0 0 1000 300"
        fill="none"
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Main cracks radiating from center */}
        <path
          className="crack-line"
          d="M500 300 L498 280 L505 250 L495 220 L500 190 L490 160"
          stroke="#4A3828"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="crack-glow"
          d="M500 300 L498 280 L505 250 L495 220 L500 190 L490 160"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0"
          filter="url(#glowFilter)"
        />

        <path
          className="crack-line"
          d="M500 280 L520 260 L540 240 L570 235 L600 220"
          stroke="#4A3828"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="crack-glow"
          d="M500 280 L520 260 L540 240 L570 235 L600 220"
          stroke="#E89C3D"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0"
        />

        <path
          className="crack-line"
          d="M500 280 L480 260 L460 245 L430 238 L400 225"
          stroke="#4A3828"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="crack-glow"
          d="M500 280 L480 260 L460 245 L430 238 L400 225"
          stroke="#E89C3D"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0"
        />

        {/* Secondary cracks */}
        <path
          className="crack-line"
          d="M520 260 L535 270 L560 280 L580 295"
          stroke="#4A3828"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="crack-line"
          d="M480 260 L465 268 L445 278 L420 290"
          stroke="#4A3828"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="crack-line"
          d="M505 250 L515 245 L530 250 L545 260"
          stroke="#4A3828"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          className="crack-line"
          d="M495 250 L485 248 L470 252 L455 265"
          stroke="#4A3828"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Glow filter */}
        <defs>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Debris particle container */}
      <div ref={debrisRef} className="absolute inset-0" />

      {/* Golden light beam from cracks */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-full opacity-0"
        style={{
          background: 'linear-gradient(to top, rgba(212,175,55,0.3) 0%, rgba(232,156,61,0.1) 40%, transparent 100%)',
          animation: 'none',
        }}
        id="crack-light-beam"
      />
    </div>
  );
}
