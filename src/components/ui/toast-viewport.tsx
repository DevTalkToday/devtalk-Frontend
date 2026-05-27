"use client";

import { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastPayload } from "@/lib/toast/events";

type ToastItem = ToastPayload & {
  id: number;
};

const toneClassName: Record<NonNullable<ToastPayload["tone"]>, string> = {
  error: "border-(--danger) text-(--danger)",
  success: "border-(--accent) text-(--accent)",
  info: "border-(--border) text-(--foreground)",
};

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;

      const id = Date.now() + Math.random();
      setItems((current) => {
        const exists = current.some(
          (item) => item.message === detail.message && item.title === detail.title && item.tone === detail.tone,
        );
        return exists ? current : [...current, { ...detail, id }].slice(-4);
      });
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4200);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3" role="status" aria-live="polite">
      {items.map((item) => {
        const tone = item.tone ?? "info";

        return (
          <div
            key={item.id}
            className={[
              "toast-slide-in rounded-[14px] border bg-(--surface-raised) p-4 shadow-(--shadow) backdrop-blur-[18px]",
              toneClassName[tone],
            ].join(" ")}
          >
            {item.title ? <p className="text-sm font-semibold text-(--foreground)">{item.title}</p> : null}
            <p className={["text-sm leading-6", item.title ? "mt-1" : ""].join(" ")}>{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
