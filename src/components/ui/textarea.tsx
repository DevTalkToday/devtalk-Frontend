import type { ReactNode, TextareaHTMLAttributes } from "react";
import { Field } from "./field";
import { textFieldClassName } from "./input";

type SurfaceTone = "raised" | "base";
type SurfaceRadius = "lg" | "xl";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  content?: string;
  fieldClassName?: string;
  textareaClassName?: string;
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
};

export function Textarea({
  id,
  label,
  description,
  hint,
  content,
  className,
  fieldClassName,
  textareaClassName,
  tone = "raised",
  radius = "lg",
  ...props
}: Props) {
  return (
    <Field
      label={label}
      description={description}
      hint={hint}
      htmlFor={id}
      className={fieldClassName}
    >
      <textarea
        id={id}
        placeholder={props.placeholder ?? content}
        className={textFieldClassName({
          tone,
          radius,
          className: ["resize-y", className, textareaClassName].filter(Boolean).join(" "),
        })}
        {...props}
      />
    </Field>
  );
}
