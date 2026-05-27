"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { ensureAccessToken } from "@/lib/auth/session";
import { QueryProvider } from "@/lib/query/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureAccessToken().catch(() => {
      // Request helpers surface token errors when a feature actually needs one.
    });
  }, []);

  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <ToastViewport />
      </QueryProvider>
    </ThemeProvider>
  );
}
