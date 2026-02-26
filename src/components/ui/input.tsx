'use client'

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  content?: string;
};

export const Input = ({ label, content, className, ...props }: Props) => {

    return (
        <div>
            {label ? <p>{label}</p> : null}
            <input placeholder={content} className={["border ...", className].filter(Boolean).join(" ")} {...props} />
        </div>
    );
}