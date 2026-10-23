import CollectionDetailPage from "@/components/pages/CollectionDetailPage";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  return <CollectionDetailPage params={resolvedParams} />;
}
