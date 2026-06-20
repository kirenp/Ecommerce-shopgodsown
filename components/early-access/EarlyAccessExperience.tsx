'use client';

import { useState, useCallback } from 'react';
import SignupForm from './SignupForm';
import EarlyAccessFooter from './EarlyAccessFooter';

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
              Thank you for joining the <span className="font-geishta">GODS OWN</span> Early Access list. You&apos;ll be among the first to receive exclusive launch announcements, limited releases, and private access to upcoming collections.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black select-none overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      
      {/* Signup Section (Full Viewport) */}
      <div 
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden flex-shrink-0 z-10"
      >
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

        {/* Bottom Fade to Black */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none z-[2]" />

        {/* Centered Editorial Container */}
        <div className="relative w-full max-w-[900px] px-6 py-12 flex flex-col items-center justify-center min-h-screen text-center z-10 animate-luxury-fade">
          {renderContent()}
        </div>
      </div>

      {/* Premium Heritage Footer */}
      <EarlyAccessFooter />

    </div>
  );
}
