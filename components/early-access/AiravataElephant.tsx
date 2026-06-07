'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Highly detailed SVG Airavata Elephant — Kerala temple ceremonial style
function ElephantSVG({ mirror = false, id }: { mirror?: boolean; id: string }) {
  return (
    <svg
      viewBox="0 0 450 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#9E918A" />
          <stop offset="20%" stopColor="#7D726C" />
          <stop offset="50%" stopColor="#655B55" />
          <stop offset="80%" stopColor="#534842" />
          <stop offset="100%" stopColor="#443A34" />
        </linearGradient>
        <linearGradient id={`${id}-bodyDark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#655B55" />
          <stop offset="100%" stopColor="#3E3430" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0C850" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#E89C3D" />
          <stop offset="100%" stopColor="#C49A2E" />
        </linearGradient>
        <linearGradient id={`${id}-goldV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C850" />
          <stop offset="100%" stopColor="#B8942D" />
        </linearGradient>
        <linearGradient id={`${id}-tusk`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFFEF5" />
          <stop offset="50%" stopColor="#F5F0E6" />
          <stop offset="100%" stopColor="#D4C5A9" />
        </linearGradient>
        <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E8E0D0" />
        </linearGradient>
        <radialGradient id={`${id}-earInner`}>
          <stop offset="0%" stopColor="#8B7B73" />
          <stop offset="100%" stopColor="#655B55" />
        </radialGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* ══════ MAIN BODY ══════ */}
      {/* Massive torso — barrel-shaped */}
      <path
        d="M220 190 C280 185 340 210 370 270 C395 325 390 390 380 440
           L375 460 L370 475
           C340 490 300 495 260 495 C230 495 200 490 175 480
           L168 460 L160 440
           C148 385 150 325 165 270 C185 215 200 195 220 190Z"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />

      {/* Body contour lines for volume */}
      <path
        d="M195 250 C210 260 250 270 310 268"
        stroke="#5A4F49"
        strokeWidth="0.6"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M175 350 C200 365 260 375 340 360"
        stroke="#5A4F49"
        strokeWidth="0.5"
        fill="none"
        opacity="0.2"
      />

      {/* ══════ HIND LEGS ══════ */}
      {/* Hind left */}
      <path
        d="M190 440 C188 470 184 510 180 550 C178 565 178 575 182 585
           L180 600 L175 610 L210 610 L208 600 L210 585
           C215 570 218 555 220 540 C222 510 220 480 215 455"
        fill={`url(#${id}-bodyDark)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />
      {/* Hind right */}
      <path
        d="M330 445 C335 475 338 510 340 550 C342 565 342 575 338 585
           L340 600 L345 610 L310 610 L312 600 L310 585
           C305 570 302 555 300 540 C298 510 300 480 305 455"
        fill={`url(#${id}-bodyDark)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />

      {/* ══════ FRONT LEGS ══════ */}
      {/* Front left */}
      <path
        d="M175 380 C170 410 165 445 160 480 C158 510 156 545 155 570
           C154 585 155 595 158 605 L155 615 L152 618 L190 618 L187 605
           C190 595 192 580 192 565 C192 540 188 500 185 465
           C183 440 182 410 185 390"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />
      {/* Front right */}
      <path
        d="M350 385 C355 415 360 450 365 485 C367 515 369 545 370 570
           C371 585 370 595 367 605 L370 615 L373 618 L335 618 L338 605
           C335 595 333 580 333 565 C333 540 337 500 340 465
           C342 440 343 415 340 395"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />

      {/* Toenails */}
      {[160, 170, 180].map((x, i) => (
        <ellipse key={`ftl-${i}`} cx={x} cy="617" rx="5" ry="3" fill="#8B7B73" stroke="#5A4F49" strokeWidth="0.3" />
      ))}
      {[345, 355, 365].map((x, i) => (
        <ellipse key={`ftr-${i}`} cx={x} cy="617" rx="5" ry="3" fill="#8B7B73" stroke="#5A4F49" strokeWidth="0.3" />
      ))}
      {[185, 195, 205].map((x, i) => (
        <ellipse key={`hrl-${i}`} cx={x} cy="610" rx="5" ry="3" fill="#7D726C" stroke="#5A4F49" strokeWidth="0.3" />
      ))}
      {[315, 325, 335].map((x, i) => (
        <ellipse key={`hrr-${i}`} cx={x} cy="610" rx="5" ry="3" fill="#7D726C" stroke="#5A4F49" strokeWidth="0.3" />
      ))}

      {/* ══════ HEAD ══════ */}
      <path
        d="M200 110 C200 75 215 50 245 42 C275 35 310 50 325 80
           C335 105 335 135 325 160 C315 180 295 195 270 200
           C245 205 220 195 205 175 C195 160 192 135 200 110Z"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="0.5"
      />

      {/* Forehead dome */}
      <path
        d="M215 75 C225 55 255 45 280 52 C305 60 318 80 315 100"
        fill="none"
        stroke="#7D726C"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* ══════ EAR ══════ */}
      <path
        d="M195 90 C170 70 140 75 130 100 C120 130 125 165 140 185
           C155 200 175 195 190 180 C200 170 205 150 200 130"
        fill={`url(#${id}-earInner)`}
        stroke="#5A4F49"
        strokeWidth="0.8"
      />
      {/* Ear inner detail */}
      <path
        d="M180 95 C160 85 145 95 140 115 C135 140 140 165 150 178"
        fill="none"
        stroke="#534842"
        strokeWidth="0.5"
        opacity="0.4"
      />

      {/* ══════ TRUNK ══════ */}
      <path
        d="M250 165 C248 185 242 210 235 240 C228 270 222 300 220 325
           C218 345 220 365 228 380 C235 392 245 395 250 388
           C255 380 252 365 248 348 C244 330 245 310 250 290
           C255 270 260 245 262 220 C264 200 260 180 255 170"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Trunk ridges */}
      {[200, 230, 260, 295, 325, 350].map((y, i) => (
        <path
          key={`ridge-${i}`}
          d={`M${240 - i * 1.5} ${y} C${245 - i} ${y - 2} ${252 - i * 0.5} ${y - 2} ${258 - i * 2} ${y}`}
          stroke="#5A4F49"
          strokeWidth="0.4"
          fill="none"
          opacity="0.3"
        />
      ))}

      {/* Trunk tip — curled upward */}
      <path
        d="M228 380 C224 395 230 408 242 410 C252 408 258 398 254 386"
        fill={`url(#${id}-body)`}
        stroke="#5A4F49"
        strokeWidth="0.8"
      />

      {/* ══════ TUSKS ══════ */}
      <path
        d="M242 190 C238 220 232 260 230 290 C228 310 232 325 238 330"
        stroke={`url(#${id}-tusk)`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${id}-shadow)`}
      />
      {/* Tusk highlight */}
      <path
        d="M244 195 C241 220 236 255 234 285"
        stroke="#FFFEF5"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* ══════ EYE ══════ */}
      <ellipse cx="222" cy="115" rx="10" ry="7" fill="#2B1D14" />
      <ellipse cx="220" cy="114" rx="5" ry="3.5" fill="#3D2E1E" />
      <ellipse cx="219" cy="113" rx="2.5" ry="1.8" fill="#D4AF37" opacity="0.5" />
      <ellipse cx="218" cy="112" rx="1" ry="0.8" fill="#F5F0E6" opacity="0.7" />
      {/* Eyelid crease */}
      <path d="M212 110 C216 107 222 106 232 109" stroke="#5A4F49" strokeWidth="0.6" fill="none" opacity="0.5" />

      {/* ══════ ORNAMENTS — NETTIPATTAM ══════ */}
      {/* Large forehead plate */}
      <path
        d="M210 65 C220 45 250 32 275 38 C300 44 315 60 320 75
           L310 90 C300 80 280 72 260 70 C240 68 222 72 215 80 Z"
        fill={`url(#${id}-gold)`}
        stroke="#B8942D"
        strokeWidth="0.8"
      />
      {/* Crown spire */}
      <path d="M252 38 L260 10 L268 38" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.5" />
      <path d="M245 42 L250 18 L260 10 L270 18 L275 42" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.6" />
      {/* Crown jewels */}
      <circle cx="260" cy="15" r="5" fill="#D4AF37" />
      <circle cx="260" cy="15" r="3" fill="#F0C850" />
      <circle cx="260" cy="15" r="1.5" fill="#FFF8E0" opacity="0.9" />
      {/* Side ornament points */}
      <path d="M215 65 L208 50 L220 58" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.3" />
      <path d="M312 68 L318 52 L306 62" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.3" />

      {/* Forehead chain — cascading gold links */}
      <path
        d="M218 82 C230 92 245 95 260 92 C275 89 290 84 305 78"
        stroke="#D4AF37"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M218 82 C230 92 245 95 260 92 C275 89 290 84 305 78"
        stroke="#F0C850"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Hanging medallions from chain */}
      {[232, 252, 272, 292].map((x, i) => (
        <g key={`medal-${i}`}>
          <line x1={x} y1={88 - i * 1} x2={x} y2={98 - i * 1} stroke="#D4AF37" strokeWidth="1" />
          <circle cx={x} cy={101 - i * 1} r="3.5" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.3" />
          <circle cx={x} cy={101 - i * 1} r="1.5" fill="#F0C850" />
        </g>
      ))}

      {/* ══════ NECK NECKLACE — Heavy gold Mala ══════ */}
      {/* First necklace — thick */}
      <path
        d="M195 175 C210 195 240 210 270 205 C300 200 325 185 340 172"
        stroke={`url(#${id}-gold)`}
        strokeWidth="7"
        fill="none"
      />
      <path
        d="M195 175 C210 195 240 210 270 205 C300 200 325 185 340 172"
        stroke="#F0C850"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      {/* Second necklace — thinner */}
      <path
        d="M192 182 C208 205 242 222 272 216 C302 210 328 192 345 178"
        stroke="#D4AF37"
        strokeWidth="4"
        fill="none"
      />
      {/* Large pendant */}
      <path
        d="M265 220 L260 245 L255 220"
        fill={`url(#${id}-gold)`}
        stroke="#B8942D"
        strokeWidth="0.5"
      />
      <circle cx="260" cy="248" r="8" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.5" />
      <circle cx="260" cy="248" r="5" fill="#E89C3D" />
      <circle cx="260" cy="248" r="2.5" fill="#F0C850" />

      {/* ══════ BODY CAPARISON / NETTIPATTAM ══════ */}
      {/* Decorative back cloth / Caparison */}
      <path
        d="M200 230 C220 225 270 222 330 235"
        stroke={`url(#${id}-gold)`}
        strokeWidth="5"
        fill="none"
      />
      <path
        d="M195 238 C220 232 275 228 335 242"
        stroke="#D4AF37"
        strokeWidth="2"
        fill="none"
        strokeDasharray="6 3"
      />

      {/* Hanging bells along body chain */}
      {[215, 240, 265, 290, 315].map((x, i) => (
        <g key={`bell-${i}`}>
          <line x1={x} y1={233 + (i % 2) * 3} x2={x} y2={248 + (i % 2) * 3} stroke="#D4AF37" strokeWidth="0.8" />
          <path
            d={`M${x - 4} ${248 + (i % 2) * 3} L${x} ${258 + (i % 2) * 3} L${x + 4} ${248 + (i % 2) * 3}`}
            fill={`url(#${id}-gold)`}
            stroke="#B8942D"
            strokeWidth="0.3"
          />
          <circle cx={x} cy={260 + (i % 2) * 3} r="1.5" fill="#E89C3D" />
        </g>
      ))}

      {/* ══════ WHITE CLOTH DRAPING ══════ */}
      <path
        d="M175 270 C180 265 190 268 200 272 C210 276 220 274 230 278"
        stroke={`url(#${id}-cloth)`}
        strokeWidth="5"
        fill="none"
        opacity="0.8"
      />
      {/* Hanging cloth panel */}
      <path
        d="M172 275 L158 420 C160 428 170 428 172 420 L185 280"
        fill={`url(#${id}-cloth)`}
        opacity="0.6"
        stroke="#D4C5A9"
        strokeWidth="0.5"
      />
      {/* Cloth folds */}
      <path d="M163 320 C166 318 168 320 170 318" stroke="#C5B8A8" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M161 360 C164 358 167 360 169 358" stroke="#C5B8A8" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M160 400 C163 398 165 400 167 398" stroke="#C5B8A8" strokeWidth="0.5" fill="none" opacity="0.4" />

      {/* ══════ EAR ORNAMENTS ══════ */}
      <circle cx="142" cy="120" r="10" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.5" />
      <circle cx="142" cy="120" r="6" fill="#E89C3D" />
      <circle cx="142" cy="120" r="3" fill="#F0C850" />
      <circle cx="142" cy="145" r="7" fill={`url(#${id}-gold)`} stroke="#B8942D" strokeWidth="0.5" />
      <circle cx="142" cy="145" r="4" fill="#E89C3D" />
      {/* Ear chain */}
      <path d="M142 130 L142 138" stroke="#D4AF37" strokeWidth="1.5" />

      {/* ══════ ANKLETS ══════ */}
      {[
        { x: 170, y: 604 },
        { x: 350, y: 604 },
        { x: 195, y: 600 },
        { x: 325, y: 600 },
      ].map((pos, i) => (
        <g key={`anklet-${i}`}>
          <ellipse cx={pos.x} cy={pos.y} rx="18" ry="5" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="3.5" />
          <ellipse cx={pos.x} cy={pos.y} rx="18" ry="5" fill="none" stroke="#F0C850" strokeWidth="1" opacity="0.3" />
          {Array.from({ length: 6 }).map((_, j) => (
            <circle key={j} cx={pos.x - 12 + j * 5} cy={pos.y + 6} r="2" fill="#D4AF37" opacity="0.7" />
          ))}
        </g>
      ))}

      {/* ══════ TAIL ══════ */}
      <path
        d="M380 300 C390 290 398 285 400 275 C402 265 398 258 392 265
           C388 270 390 280 385 290"
        stroke="#655B55"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tail tuft */}
      <path
        d="M400 275 C405 268 408 262 404 258 C400 260 398 265 400 275"
        fill="#534842"
      />

      {/* ══════ SKIN TEXTURE WRINKLES ══════ */}
      <path d="M200 300 C205 298 210 300 215 298" stroke="#5A4F49" strokeWidth="0.3" fill="none" opacity="0.2" />
      <path d="M340 310 C345 308 350 310 355 308" stroke="#5A4F49" strokeWidth="0.3" fill="none" opacity="0.2" />
      <path d="M220 420 C225 418 230 420 235 418" stroke="#5A4F49" strokeWidth="0.3" fill="none" opacity="0.2" />
      <path d="M300 425 C305 423 310 425 315 423" stroke="#5A4F49" strokeWidth="0.3" fill="none" opacity="0.2" />
    </svg>
  );
}

// Dust burst effect for elephant footsteps
function FootstepDust({ side }: { side: 'left' | 'right' }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const createDust = () => {
      if (!containerRef.current) return;

      for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'absolute rounded-full';
        p.style.width = `${Math.random() * 6 + 2}px`;
        p.style.height = p.style.width;
        p.style.backgroundColor = `rgba(139, 128, 120, ${Math.random() * 0.4 + 0.1})`;
        p.style.bottom = '0';
        p.style.left = '50%';
        containerRef.current?.appendChild(p);

        gsap.to(p, {
          x: (Math.random() - 0.5) * 80,
          y: -(Math.random() * 60 + 20),
          opacity: 0,
          duration: 1.5 + Math.random(),
          ease: 'power2.out',
          onComplete: () => p.remove(),
        });
      }
    };

    const intervals = [3500, 4200, 4900, 5600, 6300];
    const timeouts = intervals.map((t) => setTimeout(createDust, t));

    return () => timeouts.forEach(clearTimeout);
  }, [side]);

  return <div ref={containerRef} className="absolute bottom-0 left-1/2 w-4 h-4" />;
}

interface AiravataElephantProps {
  side: 'left' | 'right';
}

export default function AiravataElephant({ side }: AiravataElephantProps) {
  const elephantRef = useRef<HTMLDivElement>(null);
  const ornamentGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elephantRef.current) return;

    const el = elephantRef.current;
    const startX = side === 'left' ? '-120%' : '120%';

    gsap.set(el, { x: startX, opacity: 0 });

    const tl = gsap.timeline();

    // Walk in (starts at 3s)
    tl.to(el, {
      x: '0%',
      opacity: 1,
      duration: 4,
      delay: 3,
      ease: 'power2.out',
    });

    // Walking bob
    tl.to(
      el,
      {
        y: '-2%',
        duration: 0.6,
        repeat: 6,
        yoyo: true,
        ease: 'power1.inOut',
      },
      3
    );

    // Head raise
    tl.to(el, {
      y: '-3%',
      duration: 1.5,
      ease: 'power2.out',
    });

    // Settle
    tl.to(el, {
      y: '0%',
      duration: 1,
      ease: 'power2.inOut',
    });

    // Breathing
    tl.to(el, {
      scaleY: 1.008,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tl.kill();
    };
  }, [side]);

  useEffect(() => {
    if (!ornamentGlowRef.current) return;

    gsap.to(ornamentGlowRef.current, {
      opacity: 0.8,
      duration: 2,
      delay: 7,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }, []);

  return (
    <div
      ref={elephantRef}
      className={`absolute bottom-0 ${
        side === 'left' ? 'left-0 md:left-[2%]' : 'right-0 md:right-[2%]'
      } w-[38%] md:w-[26%] lg:w-[22%] z-10`}
      style={{ opacity: 0 }}
    >
      {/* Gold aura */}
      <div
        ref={ornamentGlowRef}
        className="absolute inset-0 opacity-0"
        style={{
          background: 'radial-gradient(ellipse at center 30%, rgba(212,175,55,0.12) 0%, transparent 70%)',
          filter: 'blur(25px)',
        }}
      />

      {/* Elephant */}
      <div className="relative" style={{ filter: 'drop-shadow(0 6px 25px rgba(0,0,0,0.6))' }}>
        <ElephantSVG mirror={side === 'right'} id={`elephant-${side}`} />
      </div>

      {/* Footstep dust */}
      <FootstepDust side={side} />
    </div>
  );
}
