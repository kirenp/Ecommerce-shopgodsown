import type { Metadata } from "next";
import ProductsPageContent from "@/components/pages/ProductsPage";

export const metadata: Metadata = {
  title: "Shop — All Products | Gods Own Culture",
  description:
    "Browse all Gods Own Culture products — premium limited-release streetwear, exclusive drops, gym & street-ready fits. ShopGodsOwn collection.",
  keywords: [
    "shopgodsown products",
    "gods own clothing",
    "gods own streetwear catalog",
    "limited release streetwear india",
    "exclusive drops india",
    "buy gods own",
  ],
  alternates: { canonical: "https://shopgodsown.com/catalog" },
  openGraph: {
    title: "Shop All Products | GODS OWN",
    description: "Premium limited-release streetwear. Exclusive drops — gym & street ready.",
    url: "https://shopgodsown.com/catalog",
  },
};

export default function ProductsPage() {
  return <ProductsPageContent />;
}
