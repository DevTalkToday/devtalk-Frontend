import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { Field } from "./field";

type SurfaceTone = "raised" | "base";
type SurfaceRadius = "lg" | "xl";

const toneClassName: Record<SurfaceTone, string> = {
  raised: "bg-(--surface-raised)",
  base: "bg-(--surface)",
};

const radiusClassName: Record<SurfaceRadius, string> = {
  lg: "rounded-[22px]",
  xl: "rounded-[24px]",
};

export const textFieldClassName = ({
  tone = "raised",
  radius = "lg",
  hasLeadingVisual = false,
  className,
}: {
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
  hasLeadingVisual?: boolean;
  className?: string;
} = {}) =>
  [
    "w-full border border-(--border) px-4 py-4 text-sm text-(--foreground) outline-none transition duration-150 placeholder:text-(--muted) focus:border-(--accent) focus:ring-4 focus:ring-(--accent-soft)",
    toneClassName[tone],
    radiusClassName[radius],
    hasLeadingVisual ? "pl-11" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  content?: string;
  leadingVisual?: ReactNode;
  fieldClassName?: string;
  inputClassName?: string;
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
};

export const Input = ({
  id,
  label,
  description,
  hint,
  content,
  leadingVisual,
  className,
  fieldClassName,
  inputClassName,
  tone = "raised",
  radius = "lg",
  style,
  ...props
}: Props) => {
  const inputStyle = {
    "--field-autofill-surface":
      tone === "base" ? "var(--surface)" : "var(--surface-raised)",
    ...style,
  } as CSSProperties;

  return (
    <Field
      label={label}
      description={description}
      hint={hint}
      htmlFor={id}
      className={fieldClassName}
    >
      <div className={leadingVisual ? "relative" : undefined}>
        {leadingVisual ? (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--muted)">
            {leadingVisual}
          </div>
        ) : null}
        <input
          id={id}
          placeholder={props.placeholder ?? content}
          style={inputStyle}
          className={textFieldClassName({
            tone,
            radius,
            hasLeadingVisual: Boolean(leadingVisual),
            className: [className, inputClassName].filter(Boolean).join(" "),
          })}
          {...props}
        />
      </div>
    </Field>
  );
};
