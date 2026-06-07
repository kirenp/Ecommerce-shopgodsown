'use client';

import { useState, FormEvent } from 'react';

interface SignupFormProps {
  onComplete: () => void;
}

export default function SignupForm({ onComplete }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: 'Early Access Request',
          email,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const luxurySerifStyle = {
    fontFamily: "'Cormorant Garamond', 'Bodoni Moda', 'Playfair Display', serif",
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[900px] select-text">
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 400,
          letterSpacing: '0.02em',
        }}
        className="text-[#111111] text-center mb-4 leading-none font-geishta"
      >
        GODS OWN
      </h1>

      {/* Decorative Divider */}
      <div className="flex items-center gap-4 w-full justify-center mb-6">
        <div className="h-[1px] w-12 md:w-20 bg-[#C8A85C]/60" />
        <span className="text-[#C8A85C] text-sm leading-none">✦</span>
        <div className="h-[1px] w-12 md:w-20 bg-[#C8A85C]/60" />
      </div>

      {/* Main Headline */}
      <h2
        style={{
          ...luxurySerifStyle,
          fontSize: 'clamp(64px, 8vw, 96px)',
          fontWeight: 300,
          letterSpacing: '-0.03em',
        }}
        className="text-[#111111] text-center leading-[1] mb-8 font-light"
      >
        Opening soon
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '18px',
          lineHeight: '1.8',
        }}
        className="text-[#111111]/75 text-center max-w-[600px] mb-12 font-light px-4"
      >
        Be among the first to discover Kerala-inspired luxury and timeless craftsmanship.
      </p>

      {/* Email Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-[540px] px-4 mt-8"
      >
        <div className="w-full sm:flex-1 relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Email address"
            className="w-full h-[54px] rounded-full bg-white/65 border border-[#C8A85C]/25 px-6 text-[#111111] font-light text-base transition-all duration-300 placeholder:text-[#111111]/30 focus:outline-none focus:border-[#C8A85C] focus:ring-1 focus:ring-[#C8A85C]/20 shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto h-[54px] px-8 rounded-full bg-[#111111] text-[#C8A85C] font-semibold tracking-[0.15em] text-xs uppercase transition-all duration-300 ease-in-out hover:bg-[#C8A85C] hover:text-[#111111] hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 shadow-md whitespace-nowrap animate-none"
        >
          {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-4 font-light text-center">
          {error}
        </p>
      )}

      {/* Store Owner Login Link */}
      <div className="mt-20 select-text">
        <p className="font-luxury text-[11px] tracking-wide text-center text-[#111111]/60">
          Are you the store owner?{' '}
          <a
            href="https://admin.shopify.com/store/godsown-9751"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#C8A85C] transition-colors font-medium font-luxury"
          >
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}
