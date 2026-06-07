import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GODS OWN | Early Access',
  description:
    'Be among the first to discover authentic culture-inspired products crafted with heritage and tradition. Join the GODS OWN early access experience.',
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
