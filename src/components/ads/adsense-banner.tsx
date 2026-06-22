"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdsenseBannerProps = {
  client?: string;
  slot?: string;
  label?: string;
  className?: string;
};

type AdStatus = "pending" | "filled" | "unfilled";

const DEFAULT_LABEL = "광고";

export function AdsenseBanner({ client, slot, label = DEFAULT_LABEL, className = "" }: AdsenseBannerProps) {
  const requestedRef = useRef(false);
  const bannerRef = useRef<HTMLModElement | null>(null);
  const [adStatus, setAdStatus] = useState<AdStatus>("pending");
  const isConfigured = Boolean(client && slot);

  const requestAd = useCallback(() => {
    if (!isConfigured || requestedRef.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      requestedRef.current = true;
    } catch {
      requestedRef.current = false;
    }
  }, [isConfigured]);

  useEffect(() => {
    requestAd();
  }, [requestAd]);

  useEffect(() => {
    requestedRef.current = false;

    const bannerElement = bannerRef.current;
    if (!bannerElement) return;

    const syncAdStatus = () => {
      const nextStatus = bannerElement.dataset.adStatus;
      if (nextStatus === "filled" || nextStatus === "unfilled") {
        setAdStatus(nextStatus);
      }
    };

    syncAdStatus();

    const observer = new MutationObserver(syncAdStatus);
    observer.observe(bannerElement, { attributes: true, attributeFilter: ["data-ad-status"] });

    return () => {
      observer.disconnect();
    };
  }, [client, slot]);

  if (!isConfigured) {
    return null;
  }

  return (
    <>
      <Script
        id="adsense-script"
        async
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        strategy="afterInteractive"
        onLoad={requestAd}
      />
      <section
        aria-hidden={adStatus !== "filled"}
        className={[
          "mx-auto w-full overflow-hidden transition-[max-height,opacity,padding,margin] duration-200",
          adStatus === "filled"
            ? "mt-6 max-h-[280px] rounded-[20px] border border-(--border) bg-(--surface-raised) p-4 shadow-(--shadow)"
            : "max-h-0 border-0 p-0 opacity-0",
          className,
        ].join(" ")}
      >
        {label ? <p className="mb-2 text-xs font-semibold text-(--muted-strong)">{label}</p> : null}
        <ins
          ref={bannerRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </section>
    </>
  );
}
