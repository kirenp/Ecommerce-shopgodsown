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
      {/* Brand Heading */}
      <h1 className="font-geishta text-[#000000] text-5xl md:text-7xl mb-4 text-center tracking-wide font-medium">
        GODS <span className="text-red-600">OWN</span>
      </h1>

      {/* Decorative Divider */}
      <div className="flex items-center gap-4 w-full justify-center mb-4">
        <div className="h-[1px] w-12 md:w-16 bg-[#C8A85C]/60" />
        <span className="text-[#C8A85C] text-sm leading-none">✦</span>
        <div className="h-[1px] w-12 md:w-16 bg-[#C8A85C]/60" />
      </div>

      {/* Main Headline */}
      <h2
        style={{
          ...luxurySerifStyle,
          fontSize: 'clamp(54px, 7vw, 76px)',
          fontWeight: 300,
          letterSpacing: '-0.02em',
        }}
        className="text-[#111111] text-center leading-[1.1] mb-6 font-light"
      >
        Early Access
      </h2>

      {/* Subtitle / Description */}
      <p
        style={{
          fontSize: '16px',
          lineHeight: '1.7',
        }}
        className="text-[#111111]/80 text-center max-w-[520px] mb-10 font-light px-4"
      >
        Join the waitlist and be the first to receive launch announcements, exclusive product drops, and member-only updates.
      </p>

      {/* Email Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-[500px] px-4"
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
          className="w-full sm:w-auto h-[48px] px-6 rounded-[8px] bg-[#111111] text-[#C8A85C] font-semibold tracking-[0.15em] text-[11px] uppercase transition-all duration-300 ease-in-out hover:bg-[#C8A85C] hover:text-[#111111] hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 shadow-md whitespace-nowrap animate-none"
        >
          {isSubmitting ? 'NOTIFYING...' : 'NOTIFY ME'}
        </button>
      </form>

      {/* Small Footer Text */}
      <p
        style={{
          fontSize: '11px',
          color: '#111111',
          opacity: 0.5,
        }}
        className="mt-10 font-light text-center px-4"
      >
        No spam. Only exclusive updates and first access to new collections.
      </p>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-4 font-light text-center">
          {error}
        </p>
      )}

      {/* Store Owner Login Link */}
      <div className="mt-14 select-text">
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
