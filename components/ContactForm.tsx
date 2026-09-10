'use client';

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [liveEmailSent, setLiveEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setLiveEmailSent(Boolean(data.liveEmailSent));
      setSent(true);
    } catch (err: any) {
      console.error("Contact Form error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Form Section */}
      <section className="pt-36 pb-24 px-6 md:px-16">
        <div className="max-w-3xl mx-auto flex items-center min-h-[60vh]">
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-14 shadow-[0_8px_64px_rgba(255,255,255,0.04)]">
            {sent ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 border border-red-500/50 bg-red-500/10 rounded-full mx-auto flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ef4444]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="font-montserrat-bold text-3xl text-white font-bold">Message Received.</h3>
                <p className="text-white/70 text-sm max-w-lg mx-auto leading-relaxed">
                  {liveEmailSent ? (
                    <>
                      Thank you for reaching out to <span className="text-[#C81E1E] font-semibold">GODS OWN CULTURE</span>. Your message has been sent to <span className="text-white font-medium">godsownculture@gmail.com</span> and a confirmation copy was delivered to your email (<span className="text-white font-medium">{form.email}</span>).
                    </>
                  ) : (
                    <>
                      Thank you! Your message was received successfully. <br />
                      <span className="text-white/50 text-xs mt-2 block">
                        (To send live emails to your inbox, add your Gmail App Password to <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/90">.env.local</code> under <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/90">SMTP_PASS</code>).
                      </span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", message: "" });
                  }}
                  className="mt-6 text-[10px] text-white/40 hover:text-white uppercase tracking-[0.2em] underline underline-offset-4 transition-colors"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <p className="text-[10px] text-[#E0E0DC] tracking-[0.4em] uppercase mb-2 font-montserrat-bold font-bold">Get in Touch</p>
                  <h2 className="font-montserrat-bold text-4xl font-bold text-white tracking-tight">Let's talk.</h2>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs tracking-wide">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#E0E0DC] tracking-[0.3em] uppercase font-montserrat-bold font-bold">Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#E0E0DC] tracking-[0.3em] uppercase font-montserrat-bold font-bold">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-[#E0E0DC] tracking-[0.3em] uppercase font-montserrat-bold font-bold">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40 transition-colors resize-none"
                      placeholder="What's on your mind?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase rounded-xl hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span>Sending Message...</span>
                    ) : (
                      <span>Send Message</span>
                    )}
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
