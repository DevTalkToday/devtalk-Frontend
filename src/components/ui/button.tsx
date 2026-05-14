import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "surface" | "primary" | "home" | "danger";
export type ButtonSize = "md" | "sm";

const variantClassName: Record<ButtonVariant, string> = {
  surface:
    "border-(--border) bg-(--surface-raised) text-(--foreground) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft)",
  primary:
    "border-(--accent) bg-(--accent) text-(--primary-foreground) hover:-translate-y-px hover:brightness-110",
  home:
    "border-(--home-write-border) bg-(--home-write-bg) text-(--home-write-fg) hover:-translate-y-px hover:border-(--home-write-fg) hover:bg-(--home-write-hover)",
  danger:
    "border-(--border) bg-(--surface-raised) text-(--danger) hover:-translate-y-px hover:border-(--danger) hover:bg-(--surface-soft)",
};

const sizeClassName: Record<ButtonSize, string> = {
  md: "min-h-[2.9rem] px-4 py-3 text-sm font-semibold",
  sm: "min-h-[2.7rem] px-4 py-2.5 text-sm font-semibold",
};

export const buttonClassName = ({
  variant = "surface",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) =>
  [
    "inline-flex items-center justify-center gap-2 rounded-full border transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    sizeClassName[size],
    variantClassName[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  content?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = ({
  content,
  children,
  className,
  variant = "surface",
  size = "md",
  fullWidth = false,
  ...props
}: Props) => {
  return (
    <button
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {children ?? content}
    </button>
  );
};
