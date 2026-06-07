import { getCollectionByHandle } from "@/lib/shopify";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  const collection = await getCollectionByHandle(params.handle);

  if (!collection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Collection Header */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white uppercase mb-6">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-luxury-gold/60 text-sm tracking-[0.2em] uppercase max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}
          <div className="mt-8 flex items-center space-x-4">
            <div className="h-[1px] w-24 bg-luxury-gold" />
            <span className="text-[10px] text-luxury-gold tracking-[0.4em] uppercase">
              {collection.products.length} Products
            </span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {collection.products.map((product: any) => (
            <ProductCard
              key={product.id}
              handle={product.handle}
              image={product.image}
              title={product.title}
              price={product.price}
            />
          ))}
        </div>
        
        {collection.products.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-white/40 text-lg uppercase tracking-widest">No products found in this drop.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
