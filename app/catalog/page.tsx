import type { Metadata } from "next";
import ProductsPageContent from "@/components/pages/ProductsPage";

export const metadata: Metadata = {
  title: "Shop — All Products | God's Own Culture",
  description:
    "Browse all God's Own Culture products — premium limited-release streetwear, exclusive drops, gym & street-ready fits. ShopGodsOwn collection.",
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
    title: "Shop All Products | GOD'S OWN",
    description: "Premium limited-release streetwear. Exclusive drops — gym & street ready.",
    url: "https://shopgodsown.com/catalog",
  },
};

export default function ProductsPage() {
  return <ProductsPageContent />;
}
