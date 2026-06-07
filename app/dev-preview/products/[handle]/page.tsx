import ProductDetailPage from "@/components/pages/ProductDetailPage";

export default function ProductPage({ params }: { params: { handle: string } }) {
  return <ProductDetailPage params={params} />;
}
