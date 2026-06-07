'use client';

import React from 'react';
import { Instagram, Mail } from 'lucide-react';



/* ── High-Quality transparent payment brand logos ── */
function VisaIcon() {
  return (
    <svg viewBox="0 0 750 471" style={{ height: '14px', width: 'auto' }} aria-label="Visa">
      <path d="M278.2 334.2h-60.6l37.9-233.7h60.6L278.2 334.2z" fill="#FFF" />
      <path d="M524.3 104.9c-12-4.5-30.8-9.4-54.3-9.4-59.8 0-101.9 31.8-102.2 77.4-.3 33.7 30.1 52.5 53.1 63.7 23.6 11.5 31.5 18.8 31.4 29.1-.2 15.7-18.8 22.9-36.2 22.9-24.2 0-37.1-3.5-57-12.2l-7.8-3.7-8.5 52.4c14.1 6.5 40.3 12.2 67.4 12.5 63.6 0 104.9-31.4 105.3-80.1.2-26.7-15.9-47-50.9-63.8-21.2-10.9-34.2-18.1-34.1-29.1 0-9.8 11-20.2 34.8-20.2 19.8-.3 34.2 4.2 45.4 9l5.4 2.7 8.2-51.2z" fill="#FFF" />
      <path d="M661.6 100.5h-46.7c-14.5 0-25.3 4.2-31.7 19.4L485.2 334.2h63.6s10.4-28.9 12.7-35.2h77.7c1.8 8.2 7.4 35.2 7.4 35.2H704L661.6 100.5zm-74.8 181.3c5-13.5 24.2-65.6 24.2-65.6-.4.6 5-13.6 8.1-22.4l4.1 20.3s11.6 56.2 14.1 67.7h-50.5z" fill="#FFF" />
      <path d="M232.8 100.5L173.5 261l-6.4-32.5c-10.9-37.2-45.2-77.5-83.5-97.7l54.2 203.2h64l95-233.5h-64z" fill="#FFF" />
      <path d="M120.8 100.5H24.2L23 106c75.9 19.4 126.1 66.2 146.9 122.5L149 119.2c-3.4-14.8-14.2-18.4-28.2-18.7z" fill="#F7B600" />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 750 471" style={{ height: '14px', width: 'auto' }} aria-label="Mastercard">
      <circle cx="299" cy="236" r="148" fill="#EB001B" />
      <circle cx="451" cy="236" r="148" fill="#F79E1B" />
      <path d="M375 119.6c36.8 29.4 60.4 74.8 60.4 125.9s-23.6 96.5-60.4 125.9c-36.8-29.4-60.4-74.8-60.4-125.9s23.6-96.5 60.4-125.9z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 750 471" style={{ height: '14px', width: 'auto' }} aria-label="American Express">
      <rect x="139" y="0" width="471" height="471" rx="40" fill="#017ccc" />
      <path d="M0 221.7h36.8l8.3-19.9h18.6l8.3 19.9h72.2v-15.2l6.4 15.2h37.4l6.4-15.5v15.5h179.4l-.2-32.6h3.4c2.4.1 3.1.3 3.1 4.3v28.3h92.8v-7.6c7.5 4 19.1 7.6 34.5 7.6h39.1l8.4-19.9h18.6l8.2 19.9h75.3v-18.9l11.4 18.9h60.3V116.2h-59.8v14.7l-8.3-14.7H590v14.7l-7.6-14.7h-81.4c-14 0-26.3 1.9-36.2 7.3v-7.3h-57.1v7.3c-6.3-5.5-14.8-7.3-24.2-7.3H204.9l-14 32.3-14.4-32.3h-65.6v14.7l-7.5-14.7h-56l-26.1 59.7H0v25.8zm227.9-19.5h-22l-.1-59l-31.2 59h-18.8l-31.3-59.1v59.1h-43.6l-8.3-20h-44.9l-8.3 20H5.4l38.4-89.1h32l36.5 84.4v-84.4h35.1l28.2 51.2 25.9-51.2h35.8l.5 89.1zM65.4 163.6l-14.7-35.1-14.6 35.1h29.3z" fill="#FFF" />
    </svg>
  );
}

function RuPayIcon() {
  return (
    <svg viewBox="0 0 750 471" style={{ height: '14px', width: 'auto' }} aria-label="RuPay">
      <text x="80" y="320" fontSize="230" fontWeight="900" fontFamily="sans-serif" fontStyle="italic" fill="#FFFFFF">Ru</text>
      <text x="350" y="320" fontSize="230" fontWeight="900" fontFamily="sans-serif" fontStyle="italic" fill="#F58220">Pay</text>
      <path d="M620 130h80l-80 260h-80l80-260z" fill="#71B238" />
      <path d="M550 130h80l-80 260h-80l80-260z" fill="#F58220" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   Footer Styles — scoped with .ea-footer prefix
   ════════════════════════════════════════════════════ */
const footerCSS = `
  /* ── Google Fonts: Cinzel ── */
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');

  .ea-footer {
    position: relative;
    width: 100%;
    background: #080808;
    overflow: hidden;
    margin-top: -140px;
    padding-top: 140px;
    z-index: 0; /* Underneath the hero */
  }


  /* ── Mountain background layer ── */
  .ea-footer__bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("/images/footer bg hill.png");
    background-size: cover;
    background-position: center 30%; /* adjusted to push details down into view */
    background-repeat: no-repeat;
    opacity: 0.95;
    filter: sepia(0.25) saturate(0.8) brightness(0.85) contrast(1.1); /* warm, high-visibility cinematic grading */
    pointer-events: none;
    z-index: 0;
  }

  /* ── Warm radial bronze overlay (glow) ── */
  .ea-footer__glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 30%, rgba(184, 147, 90, 0.18) 0%, transparent 65%);
    pointer-events: none;
    z-index: 1;
  }

  /* ── Soft mist overlay for environmental depth ── */
  .ea-footer__mist {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(8, 8, 8, 0.05) 30%, rgba(8, 8, 8, 0.35) 75%, #080808 100%);
    pointer-events: none;
    z-index: 1;
  }

  /* ── Fine noise texture ── */
  .ea-footer__texture {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    pointer-events: none;
    z-index: 2;
    background-image: repeating-conic-gradient(
      rgba(168, 133, 72, 0.15) 0% 25%,
      transparent 0% 50%
    );
    background-size: 3px 3px;
  }

  /* ── Theyyam artwork (no blend mode, styled with filters) ── */
  .ea-footer__theyyam {
    position: absolute;
    left: -120px;
    bottom: -60px;
    width: 500px;
    height: auto;
    opacity: 0.22;
    filter: sepia(0.35) brightness(0.68) contrast(0.85);
    pointer-events: none;
    z-index: 2;
  }

  /* ── Container ── */
  .ea-footer__container {
    position: relative;
    max-width: 1440px;
    margin: 0 auto;
    padding: 130px 80px 0 80px; /* Reduced padding top to decrease footer height */
    z-index: 5;
  }

  /* ── Main content flex wrapper ── */
  .ea-footer__content {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 0;
    min-height: 220px;
  }

  /* ── Three nav columns ── */
  .ea-footer__nav {
    display: grid;
    grid-template-columns: 180px 180px 180px;
    gap: 40px;
    margin-right: 70px;
  }

  /* ── Column headings (Cinzel) ── */
  .ea-footer__heading {
    color: #B8935A;
    font-family: 'Cinzel', serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 18px 0;
  }

  /* ── Menu items (Inter) ── */
  .ea-footer__menu {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ea-footer__menu a {
    color: rgba(255, 255, 255, 0.65);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 2.3;
    text-decoration: none;
    display: block;
    transition: color 0.2s ease;
  }

  .ea-footer__menu a:hover {
    color: #B8935A;
  }

  .ea-footer__subtext {
    color: rgba(255, 255, 255, 0.45);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 2.3;
    margin: 0;
  }

  /* ── Social icons ── */
  .ea-footer__socials {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 18px;
    margin-top: 18px;
  }

  .ea-footer__socials a {
    color: #B8935A;
    display: flex;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .ea-footer__socials a:hover {
    color: #D4B87A;
    transform: translateY(-1px);
  }

  .ea-footer__socials svg {
    width: 19px;
    height: 19px;
  }

  /* ── Heritage Scroll Panel ── */
  .ea-footer__heritage {
    position: relative;
    width: 290px;
    flex-shrink: 0;
    margin-top: -30px; /* pull scroll slightly up to overlap the border */
  }

  .ea-footer__heritage-img {
    width: 100%;
    height: auto;
    display: block;
    opacity: 0.95;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
  }

  .ea-footer__heritage-content {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    bottom: 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 42px;
    text-align: center;
    overflow: hidden;
  }

  .ea-footer__heritage-title {
    font-family: 'Cinzel', serif;
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #2b1d14;
    text-transform: uppercase;
    margin: 0 0 3px 0;
    line-height: 1.2;
  }

  .ea-footer__heritage-divider {
    color: #b8935a;
    font-size: 8px;
    margin-bottom: 6px;
  }

  .ea-footer__heritage-desc {
    font-family: 'Inter', sans-serif;
    font-size: 10.5px;
    line-height: 1.5;
    color: #3d2a1a;
    margin: 0 0 8px 0;
    max-width: 175px;
    font-weight: 500;
  }

  .ea-footer__heritage-launch {
    font-family: 'Cinzel', serif;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #2b1d14;
    margin: 0;
    text-transform: uppercase;
  }

  /* ── Bottom Divider ── */
  .ea-footer__divider {
    display: none;
  }

  /* ── Legal bar ── */
  .ea-footer__legal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 30px;
    border-top: 1px solid rgba(184, 147, 90, 0.08);
    padding-top: 30px;
    margin-top: 35px;
  }

  .ea-footer__copyright {
    color: rgba(255, 255, 255, 0.35);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .ea-footer__links {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ea-footer__links a {
    color: rgba(255, 255, 255, 0.55);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .ea-footer__links a:hover {
    color: #B8935A;
  }

  .ea-footer__links-sep {
    color: rgba(184, 147, 90, 0.25);
    font-size: 11px;
  }

  .ea-footer__payments {
    display: flex;
    align-items: center;
  }

  .ea-footer__payments-img {
    height: 22px;
    width: auto;
    opacity: 0.75;
    transition: opacity 0.2s ease;
  }

  .ea-footer__payments-img:hover {
    opacity: 1;
  }

  /* ═══════════════════════════════════
     RESPONSIVE BREAKPOINTS
     ═══════════════════════════════════ */

  /* Laptop/Desktop (≤1366px) */
  @media (max-width: 1366px) {
    .ea-footer__container {
      padding: 95px 60px 0 60px;
    }
    .ea-footer__theyyam {
      width: 440px;
      left: -100px;
      bottom: -60px;
    }
    .ea-footer__nav {
      grid-template-columns: 160px 160px 160px;
      gap: 36px;
      margin-right: 50px;
    }
    .ea-footer__heritage {
      width: 270px;
    }
  }

  /* Large Tablet/Laptop (≤1200px) */
  @media (max-width: 1200px) {
    .ea-footer__theyyam {
      width: 460px;
      left: -120px;
      bottom: -50px;
      opacity: 0.14;
    }
    .ea-footer__nav {
      grid-template-columns: 150px 150px 150px;
      gap: 24px;
      margin-right: 40px;
    }
    .ea-footer__heritage {
      width: 250px;
    }
    .ea-footer__heritage-content {
      top: 40px;
      bottom: 30px;
      padding: 0 24px;
    }
  }

  /* Tablet (≤1024px) */
  @media (max-width: 1024px) {
    .ea-footer {
      margin-top: -100px;
      padding-top: 100px;
    }
    .ea-footer__theyyam {
      width: 400px;
      left: -90px;
      bottom: -40px;
      opacity: 0.12;
    }
    .ea-footer__container {
      padding: 70px 40px 0 40px;
    }
    .ea-footer__content {
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }
    .ea-footer__nav {
      grid-template-columns: 160px 160px 160px;
      gap: 40px;
      margin-right: 0;
      width: 100%;
      justify-content: center;
    }
    .ea-footer__heritage {
      width: 260px;
      margin-top: 0;
    }
    .ea-footer__legal {
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      padding-bottom: 30px;
    }
    .ea-footer__copyright {
      width: 100%;
      text-align: center;
      order: 3;
    }
    .ea-footer__links {
      order: 1;
    }
    .ea-footer__payments {
      order: 2;
    }
  }

  /* Medium Tablet (≤768px) */
  @media (max-width: 768px) {
    .ea-footer__theyyam {
      width: 350px;
      opacity: 0.08;
      left: -60px;
      bottom: -30px;
    }
    .ea-footer__nav {
      grid-template-columns: 140px 140px 140px;
      gap: 20px;
    }
  }

  /* Mobile (≤640px) */
  @media (max-width: 640px) {
    .ea-footer {
      margin-top: -80px;
      padding-top: 80px;
    }
    /* Reposition Theyyam as a centered watermark on mobile */
    .ea-footer__theyyam {
      width: 320px;
      left: 50%;
      bottom: auto;
      top: 50px;
      transform: translateX(-50%);
      opacity: 0.06;
    }
    .ea-footer__container {
      padding: 55px 24px 0 24px;
    }
    .ea-footer__content {
      gap: 36px;
    }
    .ea-footer__nav {
      grid-template-columns: 1fr 1fr;
      gap: 28px 20px;
      max-width: 320px;
    }
    /* Let the Help column wrap or stack nicely on small screens */
    .ea-footer__nav > div:last-child {
      grid-column: span 2;
      text-align: center;
    }
    .ea-footer__nav > div:last-child ul {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .ea-footer__nav > div:last-child ul li {
      margin: 0;
    }
    .ea-footer__nav > div:last-child h4 {
      margin-bottom: 10px;
    }
    .ea-footer__socials {
      justify-content: center;
    }
    .ea-footer__heritage {
      width: 240px;
    }
    .ea-footer__heritage-content {
      top: 36px;
      bottom: 26px;
      padding: 0 20px;
    }
    .ea-footer__heritage-title {
      font-size: 13px;
    }
    .ea-footer__heritage-desc {
      font-size: 11px;
      max-width: 170px;
      margin-bottom: 10px;
    }
    .ea-footer__heritage-launch {
      font-size: 11px;
    }
    .ea-footer__legal {
      flex-direction: column;
      gap: 16px;
    }
  }

  /* Small Mobile (≤375px) */
  @media (max-width: 375px) {
    .ea-footer__nav {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 24px;
    }
    .ea-footer__nav > div:last-child {
      grid-column: span 1;
    }
    .ea-footer__nav > div:last-child ul {
      flex-direction: column;
      gap: 0;
    }
    .ea-footer__heritage {
      width: 220px;
    }
    .ea-footer__heritage-content {
      top: 32px;
      bottom: 22px;
      padding: 0 16px;
    }
  }
`;

export default function EarlyAccessFooter() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: footerCSS }} />

      <footer className="ea-footer">
        {/* ── Mountain background layer ── */}
        <div className="ea-footer__bg" />

        {/* ── Atmospheric depth overlays ── */}
        <div className="ea-footer__glow" />
        <div className="ea-footer__mist" />
        <div className="ea-footer__texture" />

        {/* ── Theyyam artwork (no blend mode, styled with filters) ── */}
        <img
          src="/images/theyaam.png"
          alt="Theyyam Artwork"
          className="ea-footer__theyyam"
        />

        {/* ── Container ── */}
        <div className="ea-footer__container">
          {/* ── Main Content ── */}
          <div className="ea-footer__content">
            {/* ── Navigation Columns ── */}
            <div className="ea-footer__nav">
              {/* SHOP */}
              <div>
                <h4 className="ea-footer__heading">Shop</h4>
                <p className="ea-footer__subtext">Arriving soon</p>
                <div className="ea-footer__socials">
                  <a
                    href="https://instagram.com/godsownculture"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram />
                  </a>

                  <a
                    href="mailto:contact@shopgodsown.com"
                    aria-label="Email"
                  >
                    <Mail />
                  </a>
                </div>
              </div>

              {/* ABOUT */}
              <div>
                <h4 className="ea-footer__heading">About</h4>
                <ul className="ea-footer__menu">
                  {['Our Story', 'Craftsmanship'].map((item) => (
                    <li key={item}>
                      <a href="#">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* HELP */}
              <div>
                <h4 className="ea-footer__heading">Help</h4>
                <ul className="ea-footer__menu">
                  {['Contact Us'].map((item) => (
                    <li key={item}>
                      <a href="#">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Heritage Scroll Panel ── */}
            <div className="ea-footer__heritage">
              <img
                src="/images/pamphlet.png"
                alt=""
                aria-hidden="true"
                className="ea-footer__heritage-img"
              />
              <div className="ea-footer__heritage-content">
                <h4 className="ea-footer__heritage-title">
                  Stay Updated
                </h4>
                <div className="ea-footer__heritage-divider">◆</div>
                <p className="ea-footer__heritage-desc">
                  Receive launch announcements, new collections and exclusive releases.
                </p>
                <p className="ea-footer__heritage-launch">Coming Soon</p>
              </div>
            </div>
          </div>

          {/* ── Legal Bar ── */}
          <div className="ea-footer__legal">
            <p className="ea-footer__copyright">
              © 2026 webdevtrack, ALL RIGHTS RESERVED
            </p>

            <div className="ea-footer__links">
              <a href="#">Privacy Policy</a>
              <span className="ea-footer__links-sep">|</span>
              <a href="#">Terms of Service</a>
            </div>

            <div className="ea-footer__payments">
              <img
                src="/images/payment-logos-transparent.png"
                alt="Payment Methods"
                className="ea-footer__payments-img"
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
