import { Suspense } from "react";
import TrackOrderPageContent from "@/components/pages/TrackOrderPage";

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <TrackOrderPageContent />
    </Suspense>
  );
}
