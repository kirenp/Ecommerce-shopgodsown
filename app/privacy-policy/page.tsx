import type { Metadata } from "next";
import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";

export const metadata: Metadata = {
    title: "Privacy Policy — GOD’S OWN",
    description: "Privacy policy and data protection disclosures for GOD’S OWN Culture.",
};

export default function PrivacyPolicy() {
    return <PrivacyPolicyPage />;
}
