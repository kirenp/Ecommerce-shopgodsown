import CollectionDetailPage from "@/components/pages/CollectionDetailPage";

export default function CollectionPage({ params }: { params: { handle: string } }) {
  return <CollectionDetailPage params={params} />;
}
