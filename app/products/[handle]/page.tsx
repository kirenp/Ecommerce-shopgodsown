import ProductDetailPage from "@/components/pages/ProductDetailPage";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  return <ProductDetailPage params={resolvedParams} />;
}
