import { Suspense } from "react";
import OrdersPageContent from "@/components/pages/OrdersPage";

export const metadata = {
  title: "Your Orders | GodsOwn Culture",
  description: "View and manage your recent orders, purchase history, line items, and delivery status.",
};

export default function DevPreviewOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <OrdersPageContent />
    </Suspense>
  );
}
