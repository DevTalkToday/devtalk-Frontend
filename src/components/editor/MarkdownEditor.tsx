"use client";

import type { ReactNode } from "react";
import { useDeferredValue, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChainLinkIcon, CodeBracketsIcon, ListFormatIcon, QuoteIcon } from "@/components/devtalk/icons";
import { markdownComponents } from "@/components/devtalk/markdown-components";
import { normalizeRenderableMarkdown, safeUrlTransform } from "@/lib/posts/render-markdown";
import { showErrorToast } from "@/lib/toast/events";

type Props = {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
};

const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const clipMaskStyle = {
  WebkitMaskImage: "url('/clip.svg')",
  maskImage: "url('/clip.svg')",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const;

const toolbarButtonClass =
  "inline-flex size-10 items-center justify-center rounded-2xl border border-transparent text-(--muted-strong) transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-50";

function ToolbarButton({
  ariaLabel,
  title,
  onClick,
  disabled = false,
  children,
}: {
  ariaLabel: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={ariaLabel} title={title} onClick={onClick} disabled={disabled} className={toolbarButtonClass}>
      {children}
    </button>
  );
}

type EditorSelection = {
  value: string;
  start: number;
  end: number;
  selected: string;
};

type EditorUpdate = {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
};

export default function MarkdownEditor({ value, onChange, maxLength }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const markdown = value ?? "";
  const previewMarkdown = useDeferredValue(markdown);
  const canEdit = mode !== "preview";

  const updateEditor = (transform: (selection: EditorSelection) => EditorUpdate) => {
    const element = ref.current;
    const currentValue = element?.value ?? markdown;

    const start = element?.selectionStart ?? currentValue.length;
    const end = element?.selectionEnd ?? currentValue.length;
    const selected = currentValue.slice(start, end);
    const { nextValue, selectionStart, selectionEnd } = transform({ value: currentValue, start, end, selected });

    onChange(nextValue);

    requestAnimationFrame(() => {
      const textarea = ref.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const insertAtCursor = (text: string) => {
    updateEditor(({ value: currentValue, start, end }) => {
      const nextValue = currentValue.slice(0, start) + text + currentValue.slice(end);
      const cursor = start + text.length;

      return {
        nextValue,
        selectionStart: cursor,
        selectionEnd: cursor,
      };
    });
  };

  const wrapSelection = (prefix: string, suffix: string, placeholder: string) => {
    updateEditor(({ value: currentValue, start, end, selected }) => {
      const content = selected || placeholder;
      const nextValue = currentValue.slice(0, start) + prefix + content + suffix + currentValue.slice(end);
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + content.length;

      return {
        nextValue,
        selectionStart,
        selectionEnd,
      };
    });
  };

  const prefixLines = (prefix: string, placeholder: string) => {
    updateEditor(({ value: currentValue, start, end, selected }) => {
      if (!selected) {
        const insertion = `${prefix}${placeholder}`;
        const nextValue = currentValue.slice(0, start) + insertion + currentValue.slice(end);
        const selectionStart = start + prefix.length;

        return {
          nextValue,
          selectionStart,
          selectionEnd: selectionStart + placeholder.length,
        };
      }

      const nextSelected = selected
        .split("\n")
        .map((line) => (line ? `${prefix}${line}` : line))
        .join("\n");
      const nextValue = currentValue.slice(0, start) + nextSelected + currentValue.slice(end);

      return {
        nextValue,
        selectionStart: start,
        selectionEnd: start + nextSelected.length,
      };
    });
  };

  const insertCode = () => {
    updateEditor(({ value: currentValue, start, end, selected }) => {
      const useCodeBlock = selected.includes("\n");
      const content = selected || "code";
      const prefix = useCodeBlock ? "```\n" : "`";
      const suffix = useCodeBlock ? "\n```" : "`";
      const nextValue = currentValue.slice(0, start) + prefix + content + suffix + currentValue.slice(end);
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + content.length;

      return {
        nextValue,
        selectionStart,
        selectionEnd,
      };
    });
  };

  const insertLink = () => {
    updateEditor(({ value: currentValue, start, end, selected }) => {
      const label = selected || "링크 텍스트";
      const url = "https://";
      const insertion = `[${label}](${url})`;
      const nextValue = currentValue.slice(0, start) + insertion + currentValue.slice(end);
      const selectionStart = start + label.length + 3;

      return {
        nextValue,
        selectionStart,
        selectionEnd: selectionStart + url.length,
      };
    });
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("INVALID_IMAGE_FILE"));
        return;
      }

      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        reject(new Error("IMAGE_FILE_TOO_LARGE"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("IMAGE_READ_FAILED"));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
      reader.readAsDataURL(file);
    });

  const insertImageFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    for (const file of imageFiles) {
      try {
        const dataUrl = await fileToDataUrl(file);
        insertAtCursor(`\n\n![${file.name}](${dataUrl})\n\n`);
      } catch (error) {
        if (error instanceof Error && error.message === "IMAGE_FILE_TOO_LARGE") {
          showErrorToast("이미지 파일은 5MB 이하만 추가할 수 있습니다.");
          continue;
        }
        showErrorToast("이미지 파일을 불러오지 못했습니다.");
      }
    }
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    await insertImageFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const onPaste = async (event: React.ClipboardEvent) => {
    const imageItem = Array.from(event.clipboardData.items ?? []).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    await insertImageFiles([file]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-(--border) bg-(--surface-raised) p-1.5">
          <ToolbarButton ariaLabel="Heading" title="Heading" onClick={() => prefixLines("## ", "제목")} disabled={!canEdit}>
            <span className="text-[1.02rem] font-semibold">H</span>
          </ToolbarButton>
          <ToolbarButton ariaLabel="Bold" title="Bold" onClick={() => wrapSelection("**", "**", "굵은 텍스트")} disabled={!canEdit}>
            <span className="text-[1.02rem] font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton ariaLabel="Italic" title="Italic" onClick={() => wrapSelection("*", "*", "기울임 텍스트")} disabled={!canEdit}>
            <span className="text-[1.02rem] italic">I</span>
          </ToolbarButton>
          <ToolbarButton ariaLabel="List" title="List" onClick={() => prefixLines("- ", "목록 항목")} disabled={!canEdit}>
            <ListFormatIcon className="size-[18px]" />
          </ToolbarButton>
          <ToolbarButton ariaLabel="Quote" title="Quote" onClick={() => prefixLines("> ", "인용문")} disabled={!canEdit}>
            <QuoteIcon className="size-[18px]" />
          </ToolbarButton>
          <ToolbarButton ariaLabel="Code" title="Code" onClick={insertCode} disabled={!canEdit}>
            <CodeBracketsIcon className="size-[18px]" />
          </ToolbarButton>
          <ToolbarButton ariaLabel="Link" title="Link" onClick={insertLink} disabled={!canEdit}>
            <ChainLinkIcon className="size-[18px]" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={async (event) => {
              await insertImageFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <ToolbarButton ariaLabel="Insert image" title="Insert image" onClick={() => fileInputRef.current?.click()} disabled={!canEdit}>
            <span aria-hidden className="size-[18px] bg-current" style={clipMaskStyle} />
          </ToolbarButton>
        </div>

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
            maxLength={maxLength}
            onPaste={onPaste}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            placeholder="본문에 들어갈 내용을 작성해주세요."
          />
        )}

        {(mode === "preview" || mode === "split") && (
          <div className="markdown-rich min-h-[420px] w-full border-t border-(--border) px-5 py-5 md:border-l md:border-t-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform} components={markdownComponents}>
              {normalizeRenderableMarkdown(previewMarkdown)}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {typeof maxLength === "number" ? (
        <p className="text-right text-xs text-(--muted-strong)">
          {markdown.length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}
