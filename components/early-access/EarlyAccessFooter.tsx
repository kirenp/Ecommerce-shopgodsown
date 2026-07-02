'use client';

import React from 'react';
import { Instagram, Mail } from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   EARLY ACCESS FOOTER — Dark Luxury Minimal
   ════════════════════════════════════════════════════════════════ */

const footerCSS = `
  .ea-footer-dark {
    position: relative;
    width: 100%;
    background: #050505;
    overflow: hidden;
    padding: 0;
    z-index: 10;
  }

  /* ── Separator line ── */
  .ea-footer-dark__separator {
    width: 100%;
    height: 1px;
    background: rgba(255,255,255,0.08);
  }

  /* ── Container ── */
  .ea-footer-dark__container {
    position: relative;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 64px 32px;
    z-index: 5;
  }

  /* ── Main Row ── */
  .ea-footer-dark__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  /* ── Copyright ── */
  .ea-footer-dark__copyright {
    color: rgba(255,255,255,0.35);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
  }

  .ea-footer-dark__copyright a {
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .ea-footer-dark__copyright a:hover {
    color: #C1121F;
  }

  /* ── Links ── */
  .ea-footer-dark__links {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .ea-footer-dark__links a {
    color: rgba(255,255,255,0.45);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 0.3s ease;
  }

  .ea-footer-dark__links a:hover {
    color: #C1121F;
  }

  /* ── Social Icons ── */
  .ea-footer-dark__socials {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ea-footer-dark__socials a {
    color: rgba(255,255,255,0.45);
    display: flex;
    transition: color 0.3s ease, transform 0.3s ease;
  }

  .ea-footer-dark__socials a:hover {
    color: #C1121F;
    transform: translateY(-2px);
  }

  .ea-footer-dark__socials svg {
    width: 16px;
    height: 16px;
  }

  /* ═════ RESPONSIVE ═════ */
  @media (max-width: 1024px) {
    .ea-footer-dark__container {
      padding: 32px 40px 28px;
    }
  }

  @media (max-width: 767px) {
    .ea-footer-dark__container {
      padding: 28px 24px 24px;
    }
    .ea-footer-dark__row {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
    .ea-footer-dark__links {
      order: 1;
    }
    .ea-footer-dark__socials {
      order: 2;
    }
    .ea-footer-dark__copyright {
      order: 3;
    }
  }
`;

export default function EarlyAccessFooter() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: footerCSS }} />

      <footer className="ea-footer-dark">
        {/* ── Separator Line ── */}
        <div className="ea-footer-dark__separator" />

        {/* ── Container ── */}
        <div className="ea-footer-dark__container">
          <div className="ea-footer-dark__row">

            {/* Copyright */}
            <p className="ea-footer-dark__copyright">
              © 2026{' '}
              <a
                href="https://www.instagram.com/webdevtrack?igsh=OHI1eHVxMzlldGN5"
                target="_blank"
                rel="noopener noreferrer"
              >
                webdevtrack
              </a>
              , All Rights Reserved
            </p>

            {/* Links */}
            <div className="ea-footer-dark__links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>

            {/* Social */}
            <div className="ea-footer-dark__socials">
              <a
                href="https://www.instagram.com/godsownculture?igsh=ZTl1OW5wZ2lkZmFi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
              <a
                href="mailto:Godsownculture@gmail.com"
                aria-label="Email"
              >
                <Mail />
              </a>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}
