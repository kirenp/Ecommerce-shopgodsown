'use client';

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      {/* Form + Brand Name Section */}
      <section className="pt-36 pb-0 px-6 md:px-16 min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch gap-12 md:gap-0 min-h-[70vh]">

          {/* Left: Vertical Brand Name */}
          <div className="md:w-1/3 flex flex-col items-center justify-center md:pr-16 md:py-6">
            {/* Desktop & Tablet Vertical Brand Name — Inverted (bottom-to-top) */}
            <div className="hidden md:flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center gap-1.5 lg:gap-2.5 text-white font-geishta text-5xl lg:text-7xl xl:text-8xl leading-none select-none uppercase tracking-normal rotate-180">
                <span>N</span>
                <span>W</span>
                <span>O</span>
                <span className="h-6 lg:h-10" /> {/* Balanced space between OWN and GODS */}
                <span>S</span>
                <span>D</span>
                <span>O</span>
                <span>G</span>
              </div>
            </div>
            {/* Mobile horizontal / balanced */}
            <div className="md:hidden flex flex-col items-center justify-center mb-8">
              <h1 className="font-geishta text-4xl text-white uppercase tracking-wider select-none">
                GODS OWN
              </h1>
              <p className="text-white/30 text-[9px] tracking-[0.3em] uppercase mt-3">Get in touch</p>
            </div>
          </div>

          {/* Right: Glass Form */}
          <div className="md:w-2/3 flex items-center">
            <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-14 shadow-[0_8px_64px_rgba(255,255,255,0.04)]">
              {sent ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="font-brand text-3xl text-white font-light">Message sent.</h3>
                  <p className="text-white/40 text-sm tracking-wide">We'll be in touch within 24 hours.</p>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-2">Get in Touch</p>
                    <h2 className="font-brand text-4xl font-light text-white tracking-tight">Let's talk.</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Message</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/30 transition-colors resize-none"
                        placeholder="What's on your mind?"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase rounded-xl hover:bg-white/90 transition-all duration-300"
                    >
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 px-6 md:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <p className="text-[10px] text-white tracking-[0.4em] uppercase mb-4 font-bold">Our Origin</p>
              <h2 className="font-brand text-4xl md:text-5xl text-white uppercase tracking-tight">The Heart of <span className="font-geishta">GODS OWN</span></h2>
            </div>
            <p className="text-white text-[10px] tracking-[0.3em] uppercase font-light italic pb-2">
              Rooted in Kerala &bull; Reaching the World
            </p>
          </div>

          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm group" style={{ paddingBottom: "45%" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.123456789!2d76.5!3d10.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0812ed33c3a35b%3A0x1563f669a8342468!2sKerala!5e0!3m2!1sen!2sin!4v1710100000000!5m2!1sen!2sin&maptype=satellite"
              className="absolute inset-0 w-full h-full grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>

            {/* Kerala Overlay Pin (Visual only, over the map) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-luxury-kasavu animate-ping opacity-20" />
                <div className="absolute inset-3 rounded-full bg-luxury-kasavu shadow-[0_0_20px_rgba(229,196,83,0.8)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
