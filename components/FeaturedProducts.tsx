import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/shopify";
import NextImage from "next/image";

export default async function FeaturedProducts() {
  const products = await getProducts(4);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="relative py-24 bg-[#f7f5f2] overflow-hidden">

      {/* Section Header — Minimal, editorial (same format as Shop The Look) */}
      <div className="px-6 md:px-12 lg:px-16 pb-12">
        <p className="text-[9px] text-gray-500 tracking-[0.5em] uppercase mb-2">
          Collection
        </p>
        <h2 className="text-2xl md:text-3xl font-light text-black tracking-tight">
          Our Drops
        </h2>
      </div>

      {/* ── Section Content ── */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16">

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
