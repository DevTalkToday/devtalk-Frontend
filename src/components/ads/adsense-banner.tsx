"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdsenseBannerProps = {
  client?: string;
  slot?: string;
  label?: string;
};

const CONFIG_TITLE = "\uAD11\uACE0 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
const CONFIG_DESCRIPTION =
  ".env.local\uC5D0 NEXT_PUBLIC_ADSENSE_CLIENT\uC640 NEXT_PUBLIC_ADSENSE_TEST_SLOT\uC744 \uCD94\uAC00\uD558\uBA74 \uC774 \uC790\uB9AC\uC5D0 AdSense \uBC30\uB108\uAC00 \uB85C\uB4DC\uB429\uB2C8\uB2E4.";
const DEFAULT_LABEL = "\uAD11\uACE0";

export function AdsenseBanner({ client, slot, label = DEFAULT_LABEL }: AdsenseBannerProps) {
  const requestedRef = useRef(false);
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

  if (!isConfigured) {
    return (
      <section className="grid gap-2 rounded-[20px] border border-dashed border-(--border) bg-(--surface-raised) p-5 text-sm text-(--muted-strong)">
        <h2 className="font-semibold text-(--foreground)">{CONFIG_TITLE}</h2>
        <p className="leading-6">{CONFIG_DESCRIPTION}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-2 rounded-[20px] border border-(--border) bg-(--surface-raised) p-4 shadow-(--shadow)">
      <p className="text-xs font-semibold text-(--muted-strong)">{label}</p>
      <Script
        id="adsense-script"
        async
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        strategy="afterInteractive"
        onLoad={requestAd}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 120 }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}
