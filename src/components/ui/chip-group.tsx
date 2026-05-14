import type { ReactNode } from "react";
import { Field } from "./field";

export type ChipOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export const chipButtonClassName = ({
  selected,
  className,
}: {
  selected: boolean;
  className?: string;
}) =>
  [
    "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[0.88rem] font-medium transition duration-150",
    selected
      ? "border-(--accent) bg-(--surface-soft) text-(--foreground)"
      : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
    className,
  ]
    .filter(Boolean)
    .join(" ");

type Props<T extends string> = {
  label?: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  value: T;
  options: ChipOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  wrapClassName?: string;
  chipClassName?: string;
};

export function ChipGroup<T extends string>({
  label,
  description,
  hint,
  value,
  options,
  onChange,
  className,
  wrapClassName,
  chipClassName,
}: Props<T>) {
  return (
    <Field label={label} description={description} hint={hint} className={className}>
      <div className={["flex flex-wrap gap-2", wrapClassName].filter(Boolean).join(" ")}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={chipButtonClassName({
              selected: value === option.value,
              className: chipClassName,
            })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Field>
  );
}
