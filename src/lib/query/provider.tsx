"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/session";

function AuthAwareQueryCache() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let resetTimer: number | null = null;

    const resetQueriesForAuthChange = () => {
      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
      }

      // Let auth state listeners update first, then drop cached viewer-specific data.
      resetTimer = window.setTimeout(() => {
        void queryClient.cancelQueries().finally(() => {
          queryClient.clear();
        });
      }, 0);
    };

    window.addEventListener("storage", resetQueriesForAuthChange);
    window.addEventListener(AUTH_CHANGED_EVENT, resetQueriesForAuthChange);

    return () => {
      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
      }
      window.removeEventListener("storage", resetQueriesForAuthChange);
      window.removeEventListener(AUTH_CHANGED_EVENT, resetQueriesForAuthChange);
    };
  }, [queryClient]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthAwareQueryCache />
      {children}
    </QueryClientProvider>
  );
}
