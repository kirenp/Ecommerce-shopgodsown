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
      <div className="pt-40 pb-12 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-3">All Products</p>
          <h1 className="text-4xl md:text-7xl font-bold text-white tracking-[0.2em] uppercase">
            Products
          </h1>
          <p className="mt-4 text-white/40 text-sm tracking-[0.15em] uppercase max-w-2xl">
            Explore our latest drop. Precision-tailored pieces designed for the modern disruptor.
          </p>
        </div>
      </div>

      <FilterableProductGrid products={products} />

      <Footer />
    </main>
  );
}
