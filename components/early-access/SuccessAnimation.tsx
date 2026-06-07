'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function SuccessAnimation() {
  const particleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!particleContainerRef.current) return;

    const container = particleContainerRef.current;

    // Create golden particle burst
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 6 + 2;
      const angle = (Math.PI * 2 * i) / 60;
      const velocity = 80 + Math.random() * 150;

      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.transform = 'translate(-50%, -50%)';

      // Mix of gold colors
      const colors = ['#D4AF37', '#E89C3D', '#F5F0E6', '#8D5C2D'];
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.boxShadow = `0 0 ${size * 2}px ${particle.style.backgroundColor}`;

      container.appendChild(particle);

      gsap.to(particle, {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
        opacity: 0,
        scale: 0,
        duration: 1.5 + Math.random() * 0.5,
        ease: 'power3.out',
        delay: Math.random() * 0.3,
        onComplete: () => particle.remove(),
      });
    }

    // Second wave — slower, larger particles
    const timeout = setTimeout(() => {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 1;
        particle.style.position = 'absolute';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.left = '50%';
        particle.style.top = '40%';
        particle.style.backgroundColor = '#D4AF37';
        particle.style.opacity = '0.6';

        container.appendChild(particle);

        gsap.to(particle, {
          y: -(100 + Math.random() * 200),
          x: (Math.random() - 0.5) * 100,
          opacity: 0,
          duration: 2.5 + Math.random(),
          ease: 'power1.out',
          onComplete: () => particle.remove(),
        });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center px-6">
      {/* Particle burst container */}
      <div ref={particleContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(141,92,45,0.15) 100%)',
            border: '2px solid rgba(212,175,55,0.5)',
            boxShadow: '0 0 30px rgba(212,175,55,0.2)',
          }}
        >
          <motion.svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="#D4AF37"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            />
          </motion.svg>
        </div>
      </motion.div>

      {/* Success message */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative z-10 text-2xl md:text-3xl font-brand font-semibold text-center mb-4"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #E89C3D 50%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Welcome to the Journey
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="relative z-10 text-temple-ivory/60 text-sm text-center max-w-sm leading-relaxed font-luxury"
      >
        You are now part of the{' '}
        <span className="text-[#D4AF37] font-semibold">GODS OWN CULTURE</span>{' '}
        early access community.
      </motion.p>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-6 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"
      />
    </div>
  );
}
