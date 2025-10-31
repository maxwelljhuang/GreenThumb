/**
 * Application providers wrapper.
 * Wraps the app with React Query and other providers.
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { queryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers component that wraps the entire application.
 * Includes React Query with DevTools in development.
 *
 * @param props - Component props
 * @returns Wrapped children with providers
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient once per app lifecycle
  // Using useState ensures the client is created only once
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
