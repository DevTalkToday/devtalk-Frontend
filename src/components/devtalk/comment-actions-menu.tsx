"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

export type MenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "accent" | "danger";
};

const ellipsisMaskStyle = {
  WebkitMaskImage: "url('/ellipsis.svg')",
  maskImage: "url('/ellipsis.svg')",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const;

const buttonToneClass = {
  default:
    "text-(--foreground) hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
  accent: "text-(--accent) hover:border-(--accent) hover:bg-(--accent-soft)",
  danger: "text-(--danger) hover:border-(--danger) hover:bg-(--surface-soft)",
};

export function CommentActionsMenu({
  items,
  disabled = false,
}: {
  items: MenuItem[];
  disabled?: boolean;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isOpen = open && !disabled;

  const closeMenu = useEffectEvent(() => {
    setOpen(false);
  });

  const handleWindowPointerDown = useEffectEvent((event: PointerEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      closeMenu();
    }
  });

  const handleWindowKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("pointerdown", handleWindowPointerDown);
    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handleWindowPointerDown);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="댓글 기능 열기"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-10 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-(--muted-strong) transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden className="size-4 bg-current" style={ellipsisMaskStyle} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-12 z-30 min-w-40 rounded-3xl border border-(--border) bg-(--surface) p-2 shadow-(--shadow) backdrop-blur-[20px]"
        >
          <div className="grid gap-1">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={[
                  "rounded-2xl border border-transparent px-3 py-2 text-left text-sm font-medium transition duration-150",
                  buttonToneClass[item.tone ?? "default"],
                  item.disabled ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
