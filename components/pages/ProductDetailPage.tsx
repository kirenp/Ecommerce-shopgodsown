import { getProduct } from "@/lib/shopify";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";

export default async function ProductDetailPage({ params }: { params: { handle: string } }) {
  const product = await getProduct(params.handle);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ProductDetail product={product} />
      </div>

      <Footer />
    </main>
  );
}
