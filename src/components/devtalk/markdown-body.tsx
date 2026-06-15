"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown-components";
import { normalizeRenderableMarkdown, safeUrlTransform } from "@/lib/posts/render-markdown";

export function MarkdownBody({ value }: { value: string }) {
  return (
    <div className="text-(--foreground)">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform} components={markdownComponents}>
        {normalizeRenderableMarkdown(value)}
      </ReactMarkdown>
    </div>
  );
}
