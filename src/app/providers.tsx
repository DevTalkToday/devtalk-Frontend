"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryProvider } from "@/lib/query/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
