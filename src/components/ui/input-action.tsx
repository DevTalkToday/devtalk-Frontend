import type { InputHTMLAttributes, ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { Input } from "./input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  content?: string;
  leadingVisual?: ReactNode;
  actionLabel: ReactNode;
  onAction: () => void;
  actionDisabled?: boolean;
  actionVariant?: ButtonVariant;
  actionSize?: ButtonSize;
  containerClassName?: string;
  fieldClassName?: string;
  actionClassName?: string;
};

export function InputAction({
  label,
  description,
  hint,
  content,
  leadingVisual,
  actionLabel,
  onAction,
  actionDisabled,
  actionVariant = "primary",
  actionSize = "md",
  containerClassName,
  fieldClassName,
  actionClassName,
  ...props
}: Props) {
  return (
    <div className={["space-y-3", containerClassName].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <Input
          {...props}
          label={label}
          description={description}
          hint={undefined}
          content={content}
          leadingVisual={leadingVisual}
          fieldClassName={["flex-1", fieldClassName].filter(Boolean).join(" ")}
        />
        <Button
          type="button"
          variant={actionVariant}
          size={actionSize}
          disabled={actionDisabled}
          onClick={onAction}
          className={actionClassName}
        >
          {actionLabel}
        </Button>
      </div>
      {hint ? <p className="text-[0.82rem] text-(--muted)">{hint}</p> : null}
    </div>
  );
}
