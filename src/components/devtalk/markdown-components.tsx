/* eslint-disable @next/next/no-img-element */
import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-5 mb-3 whitespace-pre-wrap text-[1.8rem] font-bold tracking-[-0.03em]" {...props} />,
  h2: (props) => <h2 className="mt-5 mb-3 whitespace-pre-wrap text-[1.35rem] font-bold tracking-[-0.03em]" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-2 whitespace-pre-wrap text-[1.05rem] font-semibold tracking-[-0.02em]" {...props} />,
  h4: (props) => <h4 className="mt-4 mb-2 whitespace-pre-wrap text-[1rem] font-semibold tracking-[-0.02em]" {...props} />,
  h5: (props) => <h5 className="mt-3 mb-2 whitespace-pre-wrap text-[0.96rem] font-semibold" {...props} />,
  h6: (props) => <h6 className="mt-3 mb-2 whitespace-pre-wrap text-[0.92rem] font-semibold text-(--muted-strong)" {...props} />,
  p: (props) => <p className="my-3 whitespace-pre-wrap leading-8 text-(--foreground)" {...props} />,
  ul: (props) => <ul className="my-3 list-disc space-y-2 pl-5 text-(--foreground)" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-2 pl-5 text-(--foreground)" {...props} />,
  li: (props) => <li className="whitespace-pre-wrap leading-8" {...props} />,
  hr: (props) => <hr className="my-6 border-0 border-t border-(--border)" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-4 whitespace-pre-wrap rounded-[20px] border border-(--border) bg-(--surface-soft) px-4 py-3 text-(--muted-strong)"
      {...props}
    />
  ),
  a: (props) => <a className="text-(--accent) underline underline-offset-4" target="_blank" rel="noreferrer" {...props} />,
  img: (props) => <img className="my-4 max-w-full rounded-3xl border border-(--border)" alt={props.alt ?? ""} {...props} />,
  code: ({ inline, ...props }: MarkdownCodeProps) =>
    inline ? (
      <code className="rounded-lg bg-(--surface-soft) px-1.5 py-0.5 font-mono text-[0.92em]" {...props} />
    ) : (
      <pre className="my-4 overflow-x-auto rounded-[22px] border border-(--border) bg-(--surface-raised) p-4">
        <code className="bg-transparent p-0 font-mono" {...props} />
      </pre>
    ),
};
