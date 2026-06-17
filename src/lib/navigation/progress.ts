"use client";

declare global {
  interface Window {
    __devtalkNavigationProgress?: {
      complete: () => void;
      start: () => void;
    };
    __devtalkNavigationProgressPendingStart?: boolean;
  }
}

const getNavigationProgressController = () => {
  if (typeof window === "undefined") return null;
  return window.__devtalkNavigationProgress ?? null;
};

export const startNavigationProgress = () => {
  const controller = getNavigationProgressController();
  if (controller) {
    controller.start();
    return;
  }

  if (typeof window !== "undefined") {
    window.__devtalkNavigationProgressPendingStart = true;
  }
};

export const completeNavigationProgress = () => {
  const controller = getNavigationProgressController();
  if (controller) {
    controller.complete();
  }
};
