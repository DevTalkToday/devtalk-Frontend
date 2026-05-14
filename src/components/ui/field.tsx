import type { ReactNode } from "react";

type FieldProps = {
  label?: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  hintClassName?: string;
  children: ReactNode;
};

export function Field({
  label,
  description,
  hint,
  htmlFor,
  className,
  labelClassName,
  descriptionClassName,
  hintClassName,
  children,
}: FieldProps) {
  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      {label || description ? (
        <div className="space-y-1">
          {label ? (
            htmlFor ? (
              <label
                htmlFor={htmlFor}
                className={[
                  "block text-sm font-semibold text-(--muted-strong)",
                  labelClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </label>
            ) : (
              <p
                className={[
                  "text-sm font-semibold text-(--muted-strong)",
                  labelClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </p>
            )
          ) : null}
          {description ? (
            <p
              className={["text-sm text-(--muted)", descriptionClassName]
                .filter(Boolean)
                .join(" ")}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}

      {hint ? (
        <p
          className={["text-[0.82rem] text-(--muted)", hintClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
