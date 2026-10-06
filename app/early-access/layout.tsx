import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Early Access — Join the God's Own Club",
  description:
    "Get exclusive early access to God's Own Culture drops. Be the first to discover limited-release streetwear born from Kerala heritage. ShopGodsOwn — join the club.",
  keywords: [
    'shopgodsown early access',
    'gods own early access',
    'godsownculture early access',
    'limited release streetwear',
    'exclusive drops india',
    'gods own club',
  ],
  openGraph: {
    title: "GOD'S OWN | Early Access",
    description:
      "Be first. Join the God's Own Club for exclusive early-access drops and limited releases.",
    images: [{ url: '/images/Gods Own (1).png', alt: "God's Own Early Access" }],
  },
};

export default function EarlyAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="early-access-root">
      {children}
    </div>
  );
}
