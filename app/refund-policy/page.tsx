import type { Metadata } from "next";
import RefundPolicyPage from "@/components/pages/RefundPolicyPage";

export const metadata: Metadata = {
    title: "Refunds & Exchanges — GOD’S OWN",
    description: "Refund and exchange policy for GOD’S OWN purchases.",
};

export default function RefundPolicy() {
    return <RefundPolicyPage />;
}

