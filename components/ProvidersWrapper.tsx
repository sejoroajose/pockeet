'use client';

import dynamic from 'next/dynamic';

const ClientProviders = dynamic(
  () => import('@/lib/providers.client').then((mod) => mod.Providers),
  { ssr: false }
);

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}