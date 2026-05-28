"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FetchPostOptionalAuth } from "@/lib/api/fetch";
import { showToast } from "@/lib/toast/events";
import { FlagIcon } from "./icons";

export type ReportTargetType = "post" | "comment" | "profile";

export type ReportTarget = {
  type: ReportTargetType;
  id: string | number;
  label: string;
  url?: string;
};

type ReportPayload = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  targetUrl: string;
  subject: string;
  content: string;
};

const targetTypeLabel: Record<ReportTargetType, string> = {
  post: "게시글",
  comment: "댓글",
  profile: "프로필",
};

const getCurrentPath = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export function ReportButton({
  target,
  size = "md",
  className,
}: {
  target: ReportTarget;
  size?: "md" | "sm";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={size}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <FlagIcon className="size-4" />
        신고
      </Button>
      <ReportDialog target={target} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ReportDialog({
  target,
  open,
  onOpenChange,
}: {
  target: ReportTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const subjectId = useId();
  const contentId = useId();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const reportMutation = useMutation({
    mutationFn: (payload: ReportPayload) => FetchPostOptionalAuth("/reports", payload),
    onSuccess: () => {
      showToast({
        title: "신고 접수",
        message: "신고가 접수되었습니다.",
        tone: "success",
      });
      setSubject("");
      setContent("");
      onOpenChange(false);
    },
  });

  const reportPending = reportMutation.isPending;
  const resetReport = reportMutation.reset;

  useEffect(() => {
    if (!open) {
      resetReport();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !reportPending) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, reportPending, resetReport]);

  if (!open || !target || typeof document === "undefined") return null;

  const targetLabel = targetTypeLabel[target.type];
  const canSubmit = Boolean(subject.trim() && content.trim()) && !reportMutation.isPending;

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    reportMutation.mutate({
      targetType: target.type,
      targetId: String(target.id),
      targetLabel: target.label,
      targetUrl: target.url ?? getCurrentPath(),
      subject: subject.trim(),
      content: content.trim(),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !reportMutation.isPending) {
          onOpenChange(false);
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submitReport}
        className="max-h-[calc(100vh-2rem)] w-[min(560px,100%)] overflow-y-auto rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[20px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-(--muted)">{targetLabel} 신고</p>
            <h2 id={titleId} className="mt-2 break-words text-2xl font-semibold">
              신고하기
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-(--muted-strong)">{target.label}</p>
          </div>
          <button
            type="button"
            aria-label="신고 창 닫기"
            disabled={reportMutation.isPending}
            onClick={() => onOpenChange(false)}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-(--border) bg-(--surface-raised) text-lg leading-none text-(--muted-strong) transition hover:border-(--accent) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <Input
            id={subjectId}
            label="신고 주제"
            content="신고 주제를 입력해주세요"
            value={subject}
            maxLength={100}
            autoFocus
            onChange={(event) => setSubject(event.target.value)}
            required
            tone="base"
            radius="xl"
          />
          <Textarea
            id={contentId}
            label="신고 내용"
            content="문제가 되는 이유와 확인이 필요한 내용을 적어주세요."
            value={content}
            maxLength={1200}
            onChange={(event) => setContent(event.target.value)}
            required
            tone="base"
            radius="xl"
            className="min-h-[180px] leading-7"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-(--muted)">
            <span>{content.trim().length}/1200</span>
            {reportMutation.isError ? <span className="font-semibold text-(--danger)">신고를 접수하지 못했습니다.</span> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={reportMutation.isPending}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {reportMutation.isPending ? "접수 중..." : "신고 접수"}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
