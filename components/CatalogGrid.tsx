import ProductCard from "./ProductCard";
import { getProducts } from "@/lib/shopify";

interface CatalogGridProps {
  search?: string;
}

export default async function CatalogGrid({ search }: CatalogGridProps) {
  const allProducts = await getProducts(50);

  const products = search
    ? allProducts.filter((p: any) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  if (products.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-white/30 text-sm tracking-widest uppercase">
          {search ? `No products found for "${search}"` : "No products found."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: any) => (
        <ProductCard
          key={product.id}
          handle={product.handle}
          image={product.image}
          title={product.title}
          price={product.price}
        />
      ))}
    </div>
  );
}
