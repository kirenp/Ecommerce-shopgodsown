import NextImage from "next/image";
import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-black/10 pt-20 pb-10 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Brand Name & Snake Boat Illustration — Large */}
        <div className="border-b border-black/10 pb-16 mb-16 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 h-full">
            <div className="relative z-20">
              <h2 className="font-brand text-6xl md:text-9xl font-light text-black tracking-tight leading-none">
                Gods Own Culture
              </h2>
              <p className="mt-6 text-black/40 text-xs md:text-base max-w-lg tracking-[0.2em] leading-loose font-medium">
                The new standard of streetwear. <br />
                Redefining luxury for the disruptors of today.
              </p>
            </div>

            {/* ── Kerala Snake Boat Decoration (Chundan Vallam) ── */}
            <div
              className="relative md:absolute md:bottom-[-220px] md:right-[-10%] w-full md:w-[1500px] h-48 md:h-[600px] pointer-events-none select-none z-0"
              style={{ mixBlendMode: 'multiply' }}
            >
              <NextImage
                src="/images/kerala_snake_boat.png"
                alt="Kerala Snake Boat Illustration"
                fill
                className="object-contain object-right-bottom opacity-90 contrast-[1.1] brightness-[1.05]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-black text-[10px] font-bold tracking-[0.3em] uppercase">Shop</h3>
            <ul className="space-y-4">
              {["Catalog", "Collections", "New Drops"].map((item) => (
                <li key={item}>
                  <Link href={item === "Catalog" ? "/catalog" : item === "Collections" ? "/#collections" : "/catalog"} className="text-black/40 hover:text-black text-xs uppercase tracking-widest transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-black text-[10px] font-bold tracking-[0.3em] uppercase">Company</h3>
            <ul className="space-y-4">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-black/40 hover:text-black text-xs uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-black text-[10px] font-bold tracking-[0.3em] uppercase">Support</h3>
            <ul className="space-y-4">
              {[
                { label: "Shipping Policy", href: "/shipping-policy" },
                { label: "Refund Policy", href: "/refund-policy" },
                { label: "Terms of Service", href: "/terms-of-service" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-black/40 hover:text-black text-xs uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-black text-[10px] font-bold tracking-[0.3em] uppercase">Follow</h3>
            <div className="flex space-x-5">
              <Instagram size={18} className="text-black/40 hover:text-black cursor-pointer transition-colors" />
              <a href="#" className="text-black/40 hover:text-black cursor-pointer transition-colors" aria-label="X (Twitter)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <Facebook size={18} className="text-black/40 hover:text-black cursor-pointer transition-colors" />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/10 pt-8 text-center">
          <p className="text-black/30 text-[10px] tracking-widest uppercase">
            © {new Date().getFullYear()} WebDevTrack. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
