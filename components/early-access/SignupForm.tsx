'use client';

import { useState, FormEvent, useEffect } from 'react';

interface SignupFormProps {
  onComplete: () => void;
}

export default function SignupForm({ onComplete }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

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

    // Validate phone number format (must be 10 digits if provided)
    if (phone && phone.trim().length !== 10) {
      setError('Phone number must be exactly 10 digits.');
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
          phone,
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

  return (
    <div className="flex flex-col items-start w-full select-text">

      {/* ── EARLY ACCESS Headline ── */}
      <div
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            fontSize: 'clamp(64px, 10vw, 130px)',
            fontWeight: 300,
            letterSpacing: '-0.03em',
            lineHeight: 0.92,
            margin: 0,
          }}
        >
          <span className="text-white block">EARLY</span>
          <span style={{ color: '#C1121F' }} className="block">ACCESS</span>
        </h1>
      </div>

      {/* ── Subtitle ── */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(13px, 1.2vw, 15px)',
          lineHeight: '1.8',
          color: 'rgba(255,255,255,0.72)',
          letterSpacing: '0.02em',
          maxWidth: '500px',
          marginTop: 'clamp(24px, 3vw, 40px)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
        }}
      >
        Join the waitlist and be the first to receive launch announcements, 
        exclusive product drops, limited releases, and member-only updates.
      </p>

      {/* ── Email & Phone Form ── */}
      <form
        onSubmit={handleSubmit}
        className="w-full"
        style={{
          maxWidth: '520px',
          marginTop: 'clamp(28px, 3vw, 40px)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
        }}
      >
        {/* Inputs Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Email Input */}
          <div className="flex-1 relative">
            {/* Mail Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                // Block HTML tag symbols/code scripts
                if (/[<>{}[\]()\\/]/.test(val)) {
                  setError('Please enter a valid email address.');
                  return;
                }
                if (val.length > 100) {
                  return;
                }
                setEmail(val);
                setError('');
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="Email Address"
              className="ea-dark-input"
              style={{
                width: '100%',
                height: '56px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${focusedField === 'email' ? 'rgba(193,18,31,0.6)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                padding: '0 24px 0 44px',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                letterSpacing: '0.04em',
                outline: 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(193,18,31,0.12)' : 'none',
              }}
            />
          </div>

          {/* Phone Input */}
          <div className="flex-1 relative">
            {/* Phone Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty string so they can delete numbers
                if (val === '') {
                  setPhone('');
                  setError('');
                  return;
                }
                // Check if only digits are typed
                if (/[^\d]/.test(val)) {
                  setError('Please enter numbers only.');
                  return;
                }
                // Cap the phone length at 10 digits
                if (val.length > 10) {
                  return;
                }
                setPhone(val);
                setError('');
              }}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="Phone No."
              className="ea-dark-input"
              style={{
                width: '100%',
                height: '56px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${focusedField === 'phone' ? 'rgba(193,18,31,0.6)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                padding: '0 24px 0 44px',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                letterSpacing: '0.04em',
                outline: 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: focusedField === 'phone' ? '0 0 0 3px rgba(193,18,31,0.12)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Notify Button — Full Width Below with Running Light Border */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ea-running-light-btn group w-full"
          style={{
            height: '56px',
            marginTop: '12px',
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <span className="ea-running-light-btn-content">
            {isSubmitting ? 'NOTIFYING...' : (
              <>
                NOTIFY ME
                <span
                  className="arrow-icon"
                  style={{
                    display: 'inline-block',
                    transition: 'transform 0.3s ease',
                    fontSize: '16px',
                    fontWeight: 300,
                  }}
                >
                  →
                </span>
              </>
            )}
          </span>
        </button>

        {/* Error message */}
        {error && (
          <p
            style={{
              color: '#C1121F',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              marginTop: '12px',
              letterSpacing: '0.02em',
            }}
          >
            {error}
          </p>
        )}
      </form>

      {/* ── Fine print with shield icon ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease 0.9s',
        }}
      >
        {/* Shield Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: '14px',
            height: '14px',
            color: 'rgba(255,255,255,0.35)',
            flexShrink: 0,
          }}
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          No spam. Only exclusive updates and first access to new collections.
        </p>
      </div>
    </div>
  );
}

