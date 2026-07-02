'use client';

import { useState, useCallback, useEffect } from 'react';
import SignupForm from './SignupForm';
import EarlyAccessFooter from './EarlyAccessFooter';

type Phase = 'signup' | 'success';

export default function EarlyAccessExperience() {
  const [phase, setPhase] = useState<Phase>('signup');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger mount animations
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignupComplete = useCallback(() => {
    setPhase('success');
  }, []);

  const renderContent = () => {
    switch (phase) {
      case 'signup':
        return <SignupForm onComplete={handleSignupComplete} />;
      case 'success':
        return (
          <div
            className="flex flex-col items-center text-center max-w-[500px] mx-auto select-text"
            style={{ animation: 'eaFadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: 'clamp(48px, 6vw, 72px)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
              className="text-white mb-6"
            >
              Thank <span style={{ color: '#C1121F' }}>You</span>
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                lineHeight: '1.8',
                color: 'rgba(255,255,255,0.72)',
                letterSpacing: '0.02em',
              }}
              className="max-w-[460px]"
            >
              Thank you for joining the{' '}
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontWeight: 400,
                  fontStyle: 'italic',
                }}
                className="text-white text-lg"
              >
                GOD&apos;S OWN
              </span>{' '}
              Early Access list. You&apos;ll be among the first to receive exclusive launch announcements and limited releases.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full select-none overflow-y-auto overflow-x-hidden flex flex-col"
         style={{ background: '#050505' }}>

      {/* ════ HERO SECTION ══════════════════════════════════════════ */}
      <div className="relative w-full min-h-screen flex flex-col flex-shrink-0 z-10 overflow-hidden">

        {/* ── Desktop Background Image ── */}
        <div
          className="hidden md:block absolute inset-0 z-0"
          style={{
            backgroundImage: `url("/images/IMG_9025.JPG (1).jpeg")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.55) contrast(1.35) saturate(0.65)',
          }}
        />

        {/* ── Mobile Background Image (portrait) ── */}
        <div
          className="block md:hidden absolute inset-0 z-0"
          style={{
            backgroundImage: `url("/images/ChatGPT Image Jun 28, 2026, 06_19_01 PM.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* ── Vignette overlay ── */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 30%, rgba(5,5,5,0.7) 100%)
            `,
          }}
        />

        {/* ── Left side dark gradient for text readability (desktop) ── */}
        <div
          className="hidden md:block absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: `
              linear-gradient(to right, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.75) 35%, rgba(5,5,5,0.25) 55%, transparent 70%)
            `,
          }}
        />

        {/* ── Mobile overlay for text readability ── */}
        <div
          className="block md:hidden absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: `
              linear-gradient(to bottom, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0.3) 35%, rgba(5,5,5,0.15) 50%, rgba(5,5,5,0.5) 75%, rgba(5,5,5,0.9) 100%)
            `,
          }}
        />

        {/* ── Bottom gradient ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[3] pointer-events-none"
          style={{
            height: '250px',
            background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.6) 60%, transparent 100%)',
          }}
        />

        {/* ── Top gradient ── */}
        <div
          className="absolute top-0 left-0 right-0 z-[3] pointer-events-none"
          style={{
            height: '120px',
            background: 'linear-gradient(to bottom, rgba(5,5,5,0.5) 0%, transparent 100%)',
          }}
        />

        {/* ── Subtle Grain Texture ── */}
        <div
          className="absolute inset-0 z-[4] pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `repeating-conic-gradient(rgba(255,255,255,0.12) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '3px 3px',
          }}
        />

        {/* ════ NAVIGATION BAR ══════════════════════════════════════ */}
        <nav
          className="relative z-20 w-full flex items-center justify-between px-8 md:px-12 lg:px-16 py-6 md:py-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
          }}
        >
          {/* Logo Image — clipped to remove vertical whitespace from square PNG */}
          <div
            style={{
              width: 'clamp(140px, 16vw, 220px)',
              height: 'clamp(24px, 3vw, 36px)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <img
              src="/images/Gods Own (1).png"
              alt="God's Own"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                position: 'absolute',
                top: '50%',
                left: '0',
                transform: 'translateY(-50%)',
              }}
            />
          </div>

          {/* Tagline */}
          <div
            className="hidden md:block"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
            }}
          >
            FOR THOSE WHO <span style={{ color: '#C1121F', fontWeight: 600 }}>DON&apos;T</span> PLAY TO LOSE
          </div>
        </nav>

        {/* ══════ HERO CONTENT ═══════════════════════════════════════ */}
        <div className="relative z-10 flex-1 flex items-end md:items-center" style={{ paddingTop: 'clamp(40px, 8vh, 80px)' }}>
          <div
            className="w-full px-8 md:px-12 lg:px-16 pb-20 md:pb-28"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 1s ease 0.4s',
            }}
          >
            {/* Content - Left aligned for signup, centered for success */}
            <div className={phase === 'success' ? 'w-full flex justify-center text-center' : 'max-w-[600px]'}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ PREMIUM FOOTER ══════════════════════════════════════ */}
      <EarlyAccessFooter />
    </div>
  );
}
