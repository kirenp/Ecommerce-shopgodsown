'use client';

import { useState, useCallback } from 'react';
import SignupForm from './SignupForm';

type Phase = 'signup' | 'success';

export default function EarlyAccessExperience() {
  const [phase, setPhase] = useState<Phase>('signup');

  const handleSignupComplete = useCallback(() => {
    setPhase('success');
  }, []);

  const renderContent = () => {
    switch (phase) {
      case 'signup':
        return <SignupForm onComplete={handleSignupComplete} />;
      case 'success':
        return (
          <div className="flex flex-col items-center max-w-[650px] my-auto px-4 select-text">
            <h1
              style={{ fontFamily: "'Cormorant Garamond', 'Bodoni Moda', 'Playfair Display', serif" }}
              className="text-4xl md:text-5xl text-[#111111] tracking-[0.02em] font-light mb-4 text-center leading-none"
            >
              Thank You
            </h1>
            <div className="flex items-center gap-4 w-full justify-center my-6">
              <div className="h-[1px] w-12 md:w-16 bg-[#C8A85C]/60" />
              <span className="text-[#C8A85C] text-sm leading-none">✦</span>
              <div className="h-[1px] w-12 md:w-16 bg-[#C8A85C]/60" />
            </div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', 'Bodoni Moda', 'Playfair Display', serif",
                fontSize: '20px',
                lineHeight: '1.7',
              }}
              className="text-[#111111]/85 text-center max-w-[580px] font-light"
            >
              Thank you for joining the GodsOwn Early Access list. You&apos;ll be among the first to receive exclusive launch announcements, limited releases, and private access to upcoming collections.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Desktop Panning Background Image */}
      <div
        className="hidden md:block absolute inset-0 bg-no-repeat bg-cover bg-center origin-center scale-100 animate-luxury-bg z-0"
        style={{
          backgroundImage: `url("/images/early%20acces%20desktop.png")`,
        }}
      />

      {/* Mobile Panning Background Image */}
      <div
        className="block md:hidden absolute inset-0 bg-no-repeat bg-cover bg-center origin-center scale-100 animate-luxury-bg z-0"
        style={{
          backgroundImage: `url("/images/early%20access%20mobile.png")`,
        }}
      />

      {/* Soft Wash luxury overlay */}
      <div className="absolute inset-0 bg-white/68 backdrop-blur-[1px] z-[1]" />

      {/* Centered Editorial Container */}
      <div className="relative w-full max-w-[900px] px-6 py-12 flex flex-col items-center justify-center min-h-screen text-center z-10 animate-luxury-fade">
        {renderContent()}
      </div>

      {/* Minimal Footer */}
      <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center text-xs font-light text-[#111111]/60 z-20 w-full max-w-[500px] px-4 select-text">
        <div className="font-luxury text-[11px] tracking-wide text-center">
          Are you the store owner?{' '}
          <a
            href="https://admin.shopify.com/store/godsown-9751"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#C8A85C] transition-colors font-medium"
          >
            Log in here
          </a>
        </div>
      </footer>
    </main>
  );
}
