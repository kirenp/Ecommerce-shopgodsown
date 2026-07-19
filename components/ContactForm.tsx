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
      {/* Form Section */}
      <section className="pt-36 pb-24 px-6 md:px-16">
        <div className="max-w-3xl mx-auto flex items-center min-h-[60vh]">
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
      </section>
    </>
  );
}
