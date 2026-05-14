"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, children, className }: Props) => {
  return (
    <div className={["rounded-xl border p-4", className].filter(Boolean).join(" ")}>
      {title ? <div className="mb-3 text-sm font-semibold">{title}</div> : null}
      {children}
    </div>
  );
};