"use client";

import { NavigationProgressBar } from "@/components/navigation/navigation-progress";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { QueryProvider } from "@/lib/query/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <NavigationProgressBar />
        {children}
        <ToastViewport />
      </QueryProvider>
    </ThemeProvider>
  );
}
