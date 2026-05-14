"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown-components";

const safeUrlTransform = (url: string) => {
  try {
    const parsed = new URL(url, "http://localhost");
    if (["http:", "https:", "blob:", "data:"].includes(parsed.protocol)) return url;
    return "";
  } catch {
    return "";
  }
};

export function MarkdownBody({ value }: { value: string }) {
  return (
    <div className="text-(--foreground)">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform} components={markdownComponents}>
        {value}
      </ReactMarkdown>
    </div>
  );
}
