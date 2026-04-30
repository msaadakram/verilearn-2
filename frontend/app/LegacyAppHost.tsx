'use client';

import dynamic from 'next/dynamic';

const LegacyApp = dynamic(() => import('@/src/legacy/LegacyApp'), {
  ssr: false,
});

export default function LegacyAppHost() {
  return <LegacyApp />;
}
