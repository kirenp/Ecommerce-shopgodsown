'use client';

import { useState, useCallback, useEffect } from 'react';
import SignupForm from './SignupForm';
import EarlyAccessFooter from './EarlyAccessFooter';
import VideoFrame from './VideoFrame';

type Phase = 'signup' | 'success';

export default function EarlyAccessExperience() {
  const [phase, setPhase] = useState<Phase>('signup');
  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleEnter = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setHasEntered(true);
    }, 800); // Wait for transition animation to complete
  }, []);

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
    <div 
      className={`relative min-h-screen w-full select-none flex flex-col overflow-x-hidden ${
        hasEntered ? 'overflow-y-auto' : 'overflow-hidden h-screen'
      }`}
      style={{ background: '#050505' }}
    >

      {/* ════ INTRO SPLASH OVERLAY ════════════════════════════════ */}
      {!hasEntered && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-700 ease-in-out ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Custom style for animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes logoIntro {
              0% {
                opacity: 0;
                transform: scale(0.85) translateY(20px);
                filter: brightness(0.2) drop-shadow(0 0 0px rgba(193, 18, 31, 0));
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
                filter: brightness(1.05) drop-shadow(0 0 20px rgba(193, 18, 31, 0.65)) drop-shadow(0 0 45px rgba(193, 18, 31, 0.35));
              }
            }
            @keyframes logoPulse {
              0%, 100% {
                transform: scale(1);
                filter: brightness(1.05) drop-shadow(0 0 20px rgba(193, 18, 31, 0.65)) drop-shadow(0 0 45px rgba(193, 18, 31, 0.35));
              }
              50% {
                transform: scale(1.04);
                filter: brightness(1.15) drop-shadow(0 0 30px rgba(193, 18, 31, 0.85)) drop-shadow(0 0 65px rgba(193, 18, 31, 0.5));
              }
            }
            @keyframes buttonFadeIn {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .splash-logo {
              animation: logoIntro 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, 
                         logoPulse 4s ease-in-out infinite 1.4s;
            }
            .splash-button-container {
              animation: buttonFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
              opacity: 0;
            }
          `}} />

          {/* Logo container - enlarged */}
          <div className="w-[320px] md:w-[500px] aspect-square flex items-center justify-center mb-6 relative">
            <img 
              src="/images/Full%20sleeve%20minimal%20front%20embroidery.png" 
              alt="God's Own Logo" 
              className="w-full h-auto object-contain splash-logo select-none pointer-events-none"
            />
          </div>

          {/* Enter Button */}
          <div className="splash-button-container flex flex-col items-center gap-5">
            <p 
              className="text-[9px] tracking-[0.4em] text-white/40 uppercase font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              FOR THOSE WHO DON&apos;T PLAY TO LOSE
            </p>
            <button
              onClick={handleEnter}
              className="ea-running-light-btn group w-[220px]"
              style={{ height: '52px' }}
            >
              <span className="ea-running-light-btn-content" style={{ fontSize: '10px', letterSpacing: '0.25em' }}>
                ENTER EXPERIENCE
              </span>
            </button>
          </div>
        </div>
      )}

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
            {/* Content - Two columns on desktop for signup, centered for success */}
            {phase === 'success' ? (
              <div className="w-full flex justify-center text-center">
                {renderContent()}
              </div>
            ) : (
              <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-10 xl:gap-16">
                {/* Left Column: Signup Form */}
                <div className="w-full lg:max-w-[550px] flex-shrink-0">
                  {renderContent()}
                </div>
                {/* Right Column: Video Frame */}
                <div className="w-full lg:w-auto flex justify-center lg:justify-end lg:flex-1 mt-10 lg:mt-0 lg:-translate-y-12">
                  <VideoFrame shouldPlay={isFadingOut || hasEntered} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ PREMIUM FOOTER ══════════════════════════════════════ */}
      <EarlyAccessFooter />
    </div>
  );
}
