"use client";

import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
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
  hasTrailingVisual = false,
  className,
}: {
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
  hasLeadingVisual?: boolean;
  hasTrailingVisual?: boolean;
  className?: string;
} = {}) =>
  [
    "w-full border border-(--border) px-4 py-4 text-sm text-(--foreground) outline-none transition duration-150 placeholder:text-(--muted) focus:border-(--accent) focus:ring-4 focus:ring-(--accent-soft)",
    toneClassName[tone],
    radiusClassName[radius],
    hasLeadingVisual ? "pl-11" : "",
    hasTrailingVisual ? "pr-12" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

const iconMaskStyle = (iconUrl: string) =>
  ({
    WebkitMaskImage: `url('${iconUrl}')`,
    maskImage: `url('${iconUrl}')`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  }) as const;

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
  type,
  className,
  fieldClassName,
  inputClassName,
  tone = "raised",
  radius = "lg",
  style,
  ...props
}: Props) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputStyle = {
    "--field-autofill-surface":
      tone === "base" ? "var(--surface)" : "var(--surface-raised)",
    ...style,
  } as CSSProperties;
  const isPasswordField = type === "password";
  const resolvedType = isPasswordField && passwordVisible ? "text" : type;
  const hasTrailingVisual = isPasswordField;
  const wrapperClassName = leadingVisual || hasTrailingVisual ? "relative" : undefined;
  const toggleLabel = passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기";
  const toggleIconStyle = iconMaskStyle(passwordVisible ? "/eyeon.svg" : "/eyeoff.svg");

  return (
    <Field
      label={label}
      description={description}
      hint={hint}
      htmlFor={id}
      className={fieldClassName}
    >
      <div className={wrapperClassName}>
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
            hasTrailingVisual,
            className: [className, inputClassName].filter(Boolean).join(" "),
          })}
          {...props}
          type={resolvedType}
        />
        {isPasswordField ? (
          <button
            type="button"
            aria-label={toggleLabel}
            title={toggleLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPasswordVisible((current) => !current)}
            className="absolute right-4 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-(--muted-strong) transition duration-150 hover:text-(--foreground)"
          >
            <span aria-hidden className="size-5 bg-current" style={toggleIconStyle} />
          </button>
        ) : null}
      </div>
    </Field>
  );
};
