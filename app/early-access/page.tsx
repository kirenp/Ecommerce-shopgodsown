'use client';

import dynamic from 'next/dynamic';

const EarlyAccessExperience = dynamic(
  () => import('@/components/early-access/EarlyAccessExperience'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              border: '1.5px solid rgba(255,255,255,0.08)',
              borderTopColor: 'rgba(255,255,255,0.5)',
            }}
          />
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(255,255,255,0.3)',
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Loading...
          </p>
        </div>
      </div>
    ),
  }
);

export default function EarlyAccessPage() {
  return <EarlyAccessExperience />;
}
