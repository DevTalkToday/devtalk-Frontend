"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  content?: string;
};

export const Button = ({ content, className, ...props }: Props) => {
  return (
    <button className={["border ...", className].filter(Boolean).join(" ")} {...props}>
      {content}
    </button>
  );
};
