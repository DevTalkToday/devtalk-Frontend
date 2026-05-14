"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/devtalk/markdown-components";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

const safeUrlTransform = (url: string) => {
  try {
    const parsed = new URL(url, "http://localhost");
    if (["http:", "https:", "blob:", "data:"].includes(parsed.protocol)) return url;
    return "";
  } catch {
    return "";
  }
};

export default function MarkdownEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const markdown = value ?? "";

  const insertAtCursor = (text: string) => {
    const element = ref.current;

    if (!element) {
      onChange(markdown + text);
      return;
    }

    const start = element.selectionStart ?? markdown.length;
    const end = element.selectionEnd ?? markdown.length;
    const next = markdown.slice(0, start) + text + markdown.slice(end);

    onChange(next);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + text.length;
      element.setSelectionRange(cursor, cursor);
    });
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));

    for (const file of files) {
      const url = URL.createObjectURL(file);
      insertAtCursor(`\n\n![${file.name}](${url})\n\n`);
    }
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const imageItem = Array.from(event.clipboardData.items ?? []).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    const url = URL.createObjectURL(file);
    insertAtCursor(`\n\n![pasted-image](${url})\n\n`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["edit", "preview", "split"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[0.88rem] font-medium transition duration-150",
              mode === item
                ? "border-(--accent) bg-(--surface-soft) text-(--foreground)"
                : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
            ].join(" ")}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        className={[
          "overflow-hidden rounded-[28px] border border-(--border) bg-(--surface)",
          mode === "split" ? "grid grid-cols-1 md:grid-cols-2" : "block",
        ].join(" ")}
      >
        {(mode === "edit" || mode === "split") && (
          <textarea
            ref={ref}
            className="min-h-[420px] w-full resize-none bg-transparent px-5 py-5 text-sm leading-7 text-(--foreground) outline-none placeholder:text-(--muted)"
            value={markdown}
            onChange={(event) => onChange(event.target.value)}
            onPaste={onPaste}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            placeholder={`# 제목

문제 상황, 코드, 재현 단계, 기대 결과를 자유롭게 적어주세요.

- 이미지 붙여넣기 / 드래그 지원
- 코드 블록, 목록, 링크 지원`}
          />
        )}

        {(mode === "preview" || mode === "split") && (
          <div className="min-h-[420px] w-full border-t border-(--border) px-5 py-5 md:border-l md:border-t-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
