"use client";

import Image from "next/image";
import Link from "next/link";
import { usePreview } from "@/lib/preview";

export default function VisionSection() {
  const { getPreviewPath } = usePreview();

  return (
    <section className="py-14 px-6 md:px-12 bg-black overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
        <div className="w-full md:w-1/2 space-y-8">
          <div className="text-[10px] text-white/30 tracking-[0.4em] uppercase">Our Vision</div>
          <h2 className="font-brand text-5xl md:text-7xl font-light text-white tracking-tight uppercase">
            Fashion as<br/>Identity
          </h2>
          <p className="text-white/50 text-base leading-relaxed font-light tracking-wide max-w-lg">
            We envision a future where fashion is more than just clothing—it's a digital and physical identity. Where every piece tells the story of its wearer.
          </p>
          <Link
            href={getPreviewPath("/about#vision")}
            className="inline-block bg-transparent text-white border border-white/20 px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black hover:border-white transition-all duration-300"
          >
            Learn More
          </Link>
        </div>
        
        <div className="w-full md:w-5/12 max-w-[400px] mx-auto relative aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-2xl">
          <Image
            src="/images/hoodie-2.png"
            alt="Our Vision"
            fill
            className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </div>
    </section>
  );
}
