'use client';

import { ToastProvider } from '@heroui/react';
import { I18nProvider } from '@heroui/react/rac';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="id-ID">
        <ToastProvider placement="top end" />
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
