"use client";

import { useEffect, useRef } from "react";

const MAX_PROGRESS = 92;
const MIN_VISIBLE_MS = 220;
const FINISH_DELAY_MS = 180;
const TRICKLE_INTERVAL_MS = 140;

const getNextProgressStep = (current: number) => {
  if (current < 24) return 14;
  if (current < 48) return 8;
  if (current < 72) return 4;
  return 2;
};

const isNavigationAnchor = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest("a[href]");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
};

const shouldStartForAnchor = (anchor: HTMLAnchorElement) => {
  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#")) return false;
  if (anchor.dataset.noNavigationProgress === "true") return false;
  if (anchor.getAttribute("role") === "button") return false;
  if (anchor.hasAttribute("aria-haspopup")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const nextUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) return false;
  if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return false;

  return true;
};

export function NavigationProgressBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(false);
  const routeKeyRef = useRef("");
  const visibleRef = useRef(false);
  const visibleSinceRef = useRef(0);
  const progressRef = useRef(0);
  const finishTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = (timerRef: React.MutableRefObject<number | null>) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const clearIntervalTimer = () => {
      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
    };

    const applyProgress = (value: number, visible: boolean) => {
      progressRef.current = value;
      visibleRef.current = visible;

      if (hostRef.current) {
        hostRef.current.style.opacity = visible ? "1" : "0";
        hostRef.current.dataset.navigationVisible = visible ? "true" : "false";
      }

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${value / 100})`;
      }
    };

    const syncRoute = () => {
      const nextRouteKey = `${window.location.pathname}${window.location.search}`;
      if (!routeKeyRef.current) {
        routeKeyRef.current = nextRouteKey;
        return;
      }

      if (routeKeyRef.current === nextRouteKey) return;

      routeKeyRef.current = nextRouteKey;
      complete();
    };

    const hide = () => {
      clearTimer(hideTimerRef);
      if (hostRef.current) hostRef.current.dataset.navigationState = "idle";
      applyProgress(0, false);
    };

    const finish = () => {
      clearTimer(finishTimerRef);
      clearIntervalTimer();
      if (hostRef.current) hostRef.current.dataset.navigationState = "finishing";
      applyProgress(100, true);
      hideTimerRef.current = window.setTimeout(hide, FINISH_DELAY_MS);
    };

    const start = () => {
      clearTimer(finishTimerRef);
      clearTimer(hideTimerRef);

      if (!activeRef.current) {
        activeRef.current = true;
        visibleSinceRef.current = Date.now();
        if (hostRef.current) hostRef.current.dataset.navigationState = "loading";
        applyProgress(12, true);
      } else {
        if (hostRef.current) hostRef.current.dataset.navigationState = "loading";
        applyProgress(Math.max(progressRef.current, 12), true);
      }

      if (trickleTimerRef.current !== null) return;

      trickleTimerRef.current = window.setInterval(() => {
        if (!activeRef.current) return;

        applyProgress(Math.min(progressRef.current + getNextProgressStep(progressRef.current), MAX_PROGRESS), true);
      }, TRICKLE_INTERVAL_MS);
    };

    const complete = () => {
      clearTimer(finishTimerRef);

      if (!activeRef.current && !visibleRef.current) return;

      activeRef.current = false;
      clearIntervalTimer();

      const remaining = Math.max(MIN_VISIBLE_MS - (Date.now() - visibleSinceRef.current), 0);
      finishTimerRef.current = window.setTimeout(finish, remaining);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = isNavigationAnchor(event.target);
      if (!anchor || !shouldStartForAnchor(anchor)) return;

      start();
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Enter") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = isNavigationAnchor(event.target);
      if (!anchor || !shouldStartForAnchor(anchor)) return;

      start();
    };

    const handlePopState = () => {
      start();
      window.setTimeout(syncRoute, 0);
    };

    applyProgress(0, false);
    if (hostRef.current) hostRef.current.dataset.navigationState = "idle";
    routeKeyRef.current = `${window.location.pathname}${window.location.search}`;
    const controller = { start, complete };
    window.__devtalkNavigationProgress = controller;
    if (window.__devtalkNavigationProgressPendingStart) {
      window.__devtalkNavigationProgressPendingStart = false;
      start();
    }

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function pushState(...args) {
      const result = originalPushState(...args);
      syncRoute();
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState(...args);
      syncRoute();
      return result;
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleDocumentKeyDown, true);

    return () => {
      if (window.__devtalkNavigationProgress === controller) {
        delete window.__devtalkNavigationProgress;
      }
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      clearTimer(finishTimerRef);
      clearTimer(hideTimerRef);
      clearIntervalTimer();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden opacity-0 transition-opacity duration-200"
    >
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" />
      <div
        ref={barRef}
        className="h-full origin-left rounded-r-full bg-(--accent) shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_82%,transparent)] transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
