/* eslint-disable @next/next/no-img-element */
import { Children, isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Components } from "react-markdown";
import { BLANK_LINE_TOKEN_PREFIX, BLANK_LINE_TOKEN_SUFFIX } from "@/lib/posts/render-markdown";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

const getPlainTextChild = (children: ReactNode): string | null => {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    const text = children.map((child) => getPlainTextChild(child)).join("");
    return text || null;
  }
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return getPlainTextChild(children.props.children);
  }

  const text = Children.toArray(children)
    .map((child) => getPlainTextChild(child))
    .join("");
  return text || null;
};

const getBlankLineCount = (children: ReactNode) => {
  const text = getPlainTextChild(children)?.trim();
  if (!text?.startsWith(BLANK_LINE_TOKEN_PREFIX) || !text.endsWith(BLANK_LINE_TOKEN_SUFFIX)) return null;

  const count = Number(text.slice(BLANK_LINE_TOKEN_PREFIX.length, -BLANK_LINE_TOKEN_SUFFIX.length));
  return Number.isFinite(count) && count > 0 ? count : null;
};

const renderLooseListChildren = (children: ReactNode) => {
  let paragraphIndex = 0;

  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === "ul" || child.type === "ol") return child;

    paragraphIndex += 1;
    const content = child.props.children as ReactNode;

    return paragraphIndex === 1 ? (
      <span className="whitespace-break-spaces leading-7 text-(--foreground)">{content}</span>
    ) : (
      <div className="mt-2 whitespace-break-spaces leading-7 text-(--foreground)">{content}</div>
    );
  });
};

export const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-5 mb-3 whitespace-pre-wrap text-[1.8rem] font-bold tracking-[-0.03em]" {...props} />,
  h2: (props) => <h2 className="mt-5 mb-3 whitespace-pre-wrap text-[1.35rem] font-bold tracking-[-0.03em]" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-2 whitespace-pre-wrap text-[1.05rem] font-semibold tracking-[-0.02em]" {...props} />,
  h4: (props) => <h4 className="mt-4 mb-2 whitespace-pre-wrap text-[1rem] font-semibold tracking-[-0.02em]" {...props} />,
  h5: (props) => <h5 className="mt-3 mb-2 whitespace-pre-wrap text-[0.96rem] font-semibold" {...props} />,
  h6: (props) => <h6 className="mt-3 mb-2 whitespace-pre-wrap text-[0.92rem] font-semibold text-(--muted-strong)" {...props} />,
  p: ({ children, ...props }) => {
    const blankLineCount = getBlankLineCount(children);
    if (blankLineCount != null) {
      return <div aria-hidden className="my-0" style={{ height: `${blankLineCount * 1.75}rem` }} />;
    }

    return (
      <p className="my-2 whitespace-break-spaces leading-7 text-(--foreground)" {...props}>
        {children}
      </p>
    );
  },
  ul: (props) => <ul className="my-2 pl-0 text-(--foreground)" {...props} />,
  ol: (props) => <ol className="my-2 pl-0 text-(--foreground)" {...props} />,
  li: ({ children, ...props }) => <li className="leading-7" {...props}>{renderLooseListChildren(children)}</li>,
  hr: (props) => <hr className="my-6 border-0 border-t border-(--border)" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-3 whitespace-break-spaces rounded-[20px] border border-(--border) bg-(--surface-soft) px-4 py-2 text-(--muted-strong) [&>p]:my-0.5 [&>p]:leading-6"
      {...props}
    />
  ),
  a: (props) => <a className="text-(--accent) underline underline-offset-4" target="_blank" rel="noreferrer" {...props} />,
  img: (props) => <img className="my-4 max-w-full border border-(--border)" alt={props.alt ?? ""} {...props} />,
  code: ({ inline, ...props }: MarkdownCodeProps) =>
    inline ? (
      <code className="rounded-lg bg-(--surface-soft) px-1.5 py-0.5 font-mono text-[0.92em]" {...props} />
    ) : (
      <pre className="my-4 overflow-x-auto rounded-[22px] border border-(--border) bg-(--surface-raised) p-4">
        <code className="bg-transparent p-0 font-mono" {...props} />
      </pre>
    ),
};
