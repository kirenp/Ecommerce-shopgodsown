import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterableProductGrid from "@/components/FilterableProductGrid";
import { getProducts } from "@/lib/shopify";

export default async function ProductsPageContent() {
  const products = await getProducts(50);

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      {/* Header */}
      <div className="pt-36 pb-10 px-6 md:px-12 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-white/25 tracking-[0.3em] uppercase font-medium">Home</span>
              <span className="text-[10px] text-white/15">/</span>
              <span className="text-[10px] text-white/40 tracking-[0.3em] uppercase font-medium">Shop</span>
            </nav>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-[0.15em] uppercase">
              Products
            </h1>
            <p className="mt-4 text-white/35 text-[12px] tracking-[0.15em] uppercase max-w-xl leading-relaxed">
              Explore our latest drop. Precision-tailored pieces designed for the modern disruptor.
            </p>
          </div>
        </div>
      </div>

      <FilterableProductGrid products={products} />

      <Footer />
    </main>
  );
}
