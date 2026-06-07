'use client';

import dynamic from 'next/dynamic';

const EarlyAccessExperience = dynamic(
  () => import('@/components/early-access/EarlyAccessExperience'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#120D08] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-temple-gold/30 border-t-temple-gold rounded-full animate-spin" />
          <p className="text-temple-ivory/50 text-sm tracking-[0.3em] uppercase font-brand">
            Preparing the experience...
          </p>
        </div>
      </div>
    ),
  }
);

export default function EarlyAccessPage() {
  return <EarlyAccessExperience />;
}
