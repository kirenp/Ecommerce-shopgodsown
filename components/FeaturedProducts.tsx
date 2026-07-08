import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/shopify";
import NextImage from "next/image";

export default async function FeaturedProducts() {
  const products = await getProducts(4);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="relative py-24 px-6 md:px-12 bg-[#f7f5f2] overflow-hidden">

      {/* ── Decorative Palm Tree Disrupt — Background Overlay (Left) ── */}
      <div 
        className="absolute top-0 left-[-5%] w-[600px] h-[95%] pointer-events-none select-none z-0"
        style={{ mixBlendMode: 'multiply' }}
      >
        <NextImage
          src="/images/disrupt_tree-removebg-preview.png"
          alt=""
          fill
          className="object-contain object-left opacity-30"
          priority
        />
      </div>

      {/* ── Mirrored Palm Tree — Background Overlay (Right, "Close to screen") ── */}
      <div 
        className="absolute top-0 right-[-5%] w-[600px] h-[95%] pointer-events-none select-none z-0"
        style={{ mixBlendMode: 'multiply', transform: 'scaleX(-1)' }}
      >
        <NextImage
          src="/images/disrupt_tree-removebg-preview.png"
          alt=""
          fill
          className="object-contain object-right opacity-30"
          priority
        />
      </div>

      {/* ── Section Content — sits above illustration ── */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-black tracking-[0.2em] uppercase">
            DESIGNED TO DISRUPT
          </h2>
          <p className="text-black/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed tracking-wider uppercase">
            Luxury staples for the modern disruptor. Precision-tailored pieces that break convention and redefine presence. This isn't just fashion — it's a statement.
          </p>
        </div>

        <div className={
          products.length < 3
            ? "flex flex-wrap justify-center gap-8"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        }>
          {products.map((product: any) => (
            <div 
              key={product.id} 
              className={products.length < 3 ? "w-full max-w-[340px] sm:w-[340px]" : ""}
            >
              <ProductCard
                handle={product.handle}
                image={product.image}
                title={product.title}
                price={product.price}
                variant="glass"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
