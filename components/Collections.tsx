import { getCollections } from "@/lib/shopify";
import NextImage from "next/image";
import CollectionCarousel from "./CollectionCarousel";

export default async function Collections() {
  const collections = await getCollections();

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <section className="relative py-24 bg-[#f7f5f2] overflow-hidden">

      {/* ── Decorative Palm Tree Collections — Background Overlay (Right, Flipped) ── */}
      <div 
        className="absolute top-0 right-[-5%] w-[600px] h-[95%] pointer-events-none select-none z-0"
        style={{ mixBlendMode: 'multiply' }}
      >
        <NextImage
          src="/images/disrupt_tree-removebg-preview.png"
          alt=""
          fill
          className="object-contain object-top-right opacity-30"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* ── Mirrored Palm Tree — Background Overlay (Left, "Close to screen") ── */}
      <div 
        className="absolute top-0 left-[-5%] w-[600px] h-[95%] pointer-events-none select-none z-0"
        style={{ mixBlendMode: 'multiply' }}
      >
        <NextImage
          src="/images/disrupt_tree-removebg-preview.png"
          alt=""
          fill
          className="object-contain object-top-left opacity-30"
        />
      </div>

      {/* ── Section Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black uppercase mb-2">
            COLLECTIONS
          </h2>
          <p className="text-luxury-kasavu text-sm tracking-widest uppercase">
            EXPLORE OUR CURATED DROPS
          </p>
        </div>

        {/* Horizontal Scroll Area via Client Component for interactivity */}
        <CollectionCarousel collections={collections} />
      </div>
    </section>
  );
}
