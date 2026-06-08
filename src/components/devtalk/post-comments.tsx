"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CommentActionsMenu, type MenuItem } from "@/components/devtalk/comment-actions-menu";
import { ReportDialog, type ReportTarget } from "@/components/devtalk/report-dialog";
import { Button, Field, Textarea } from "@/components/ui";
import { FetchDeleteAuth, FetchPatchAuth, FetchPostAuth, FetchPutAuth } from "@/lib/api/fetch";
import { isLoggedIn } from "@/lib/auth/session";
import { type PostCategory, type PostComment, type PostDetail } from "@/lib/posts/types";
import { getProfileHref } from "@/lib/profile/links";

type CommentAction =
  | { type: "create"; body: string }
  | { type: "edit"; commentId: string; body: string }
  | { type: "delete"; commentId: string }
  | { type: "accept"; commentId: string; accepted: boolean };

const getComposerCopy = (category: PostCategory) => {
  if (category === "qna") {
    return {
      title: "답변 남기기",
      description: "문제 원인이나 해결 방법을 댓글로 남기고, 좋은 답변은 채택할 수 있습니다.",
      placeholder: "원인 분석, 해결 코드, 참고 자료를 정리해보세요.",
      submitLabel: "답변 등록",
    };
  }

  if (category === "bug") {
    return {
      title: "조사 로그 남기기",
      description: "작성자에게 도움된 댓글은 채택될 수 있습니다.",
      placeholder: "재현 로그, 원인 추정, 임시 우회 방법 등을 남겨보세요.",
      submitLabel: "댓글 등록",
    };
  }

  return {
    title: "댓글 남기기",
    description: "의견, 추가 맥락, 후속 질문을 자유롭게 이어서 남길 수 있습니다.",
    placeholder: "이 주제에 대한 의견을 남겨보세요.",
    submitLabel: "댓글 등록",
  };
};

const getAcceptedBadgeLabel = (category: PostCategory) => {
  if (category === "qna") return "채택 답변";
  if (category === "bug") return "채택 댓글";
  return "채택 댓글";
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function PostComments({
  post,
  onPostChange,
}: {
  post: PostDetail;
  onPostChange: (post: PostDetail) => void;
}) {
  const router = useRouter();
  const [draftComment, setDraftComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const composerCopy = getComposerCopy(post.category);
  const orderedComments = useMemo(() => {
    return [...(post.comments ?? [])].sort((left, right) => {
      const acceptedDiff = Number(Boolean(right.isAccepted)) - Number(Boolean(left.isAccepted));
      if (acceptedDiff !== 0) return acceptedDiff;
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }, [post.comments]);

  const commentMutation = useMutation<PostDetail, Error, CommentAction>({
    mutationFn: async (action) => {
      switch (action.type) {
        case "create":
          return (await FetchPostAuth(`/posts/${post.id}/comments`, { body: action.body })) as PostDetail;
        case "edit":
          return (await FetchPutAuth(`/posts/${post.id}/comments/${action.commentId}`, {
            body: action.body,
          })) as PostDetail;
        case "delete":
          return (await FetchDeleteAuth(`/posts/${post.id}/comments/${action.commentId}`)) as PostDetail;
        case "accept":
          return (await FetchPatchAuth(`/posts/${post.id}/comments/${action.commentId}`, {
            accepted: action.accepted,
          })) as PostDetail;
      }
    },
    onSuccess: (nextPost, action) => {
      onPostChange(nextPost);

      if (action.type === "create") setDraftComment("");
      if (action.type === "edit") {
        setEditingCommentId(null);
        setEditingCommentBody("");
      }
    },
  });

  const activeCommentAction = commentMutation.isPending ? commentMutation.variables ?? null : null;
  const isCreatingComment = activeCommentAction?.type === "create";
  const isEditingPending = (commentId: string) =>
    activeCommentAction?.type === "edit" && activeCommentAction.commentId === commentId;
  const isDeletingPending = (commentId: string) =>
    activeCommentAction?.type === "delete" && activeCommentAction.commentId === commentId;
  const isAcceptingPending = (commentId: string) =>
    activeCommentAction?.type === "accept" && activeCommentAction.commentId === commentId;

  const submitComment = () => {
    const body = draftComment.trim();
    if (!body || commentMutation.isPending) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    commentMutation.reset();
    commentMutation.mutate({ type: "create", body });
  };

  const startEditingComment = (comment: PostComment) => {
    commentMutation.reset();
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  };

  const cancelEditingComment = () => {
    commentMutation.reset();
    setEditingCommentId(null);
    setEditingCommentBody("");
  };

  const saveCommentEdit = (commentId: string) => {
    const body = editingCommentBody.trim();
    if (!body || commentMutation.isPending) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    commentMutation.reset();
    commentMutation.mutate({ type: "edit", commentId, body });
  };

  const removeComment = (commentId: string) => {
    if (commentMutation.isPending) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    commentMutation.reset();
    commentMutation.mutate({ type: "delete", commentId });
  };

  const toggleCommentAccept = (comment: PostComment) => {
    if (commentMutation.isPending) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    commentMutation.reset();
    commentMutation.mutate({ type: "accept", commentId: comment.id, accepted: !comment.isAccepted });
  };

  return (
    <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-[-0.03em]">댓글 스레드</p>
          <p className="text-sm text-(--muted-strong)">가이드라인에 맞춰 자유롭게 작성해 주세요.</p>
        </div>
        <span className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-(--muted-strong)">
          {(post.comments ?? []).length} comments
        </span>
      </div>

      <div className="space-y-4 rounded-3xl border border-(--border) bg-(--surface-raised) p-5">
        <Field label={composerCopy.title} description={composerCopy.description}>
          {null}
        </Field>
        <Textarea
          value={draftComment}
          maxLength={1200}
          tone="base"
          radius="xl"
          onChange={(event) => setDraftComment(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submitComment();
            }
          }}
          content={composerCopy.placeholder}
          className="min-h-[144px] leading-7"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-(--muted)">`Ctrl + Enter` 또는 `Cmd + Enter`로 바로 등록할 수 있습니다.</p>
          <Button type="button" variant="primary" onClick={submitComment} disabled={!draftComment.trim() || commentMutation.isPending}>
            {isCreatingComment ? "등록 중..." : composerCopy.submitLabel}
          </Button>
        </div>
      </div>

      {orderedComments.length ? (
        <div className="grid gap-3">
          {orderedComments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const isEdited = Boolean(comment.updatedAt && comment.updatedAt !== comment.createdAt);
            const canAccept =
              (post.category === "qna" && post.question) ||
              (post.category === "bug" && post.bug);
            const isPostAuthorComment = comment.author.id === post.author.id;
            const menuItems: MenuItem[] = [];

            if (canAccept && comment.canAccept) {
              menuItems.push({
                label: comment.isAccepted ? "채택 취소" : "댓글 채택",
                tone: comment.isAccepted ? "accent" : "default",
                onSelect: () => toggleCommentAccept(comment),
                disabled: commentMutation.isPending,
              });
            }

            if (comment.canEdit) {
              menuItems.push({ label: "수정", onSelect: () => startEditingComment(comment), disabled: commentMutation.isPending });
            }

            if (comment.canDelete) {
              menuItems.push({ label: "삭제", tone: "danger", onSelect: () => removeComment(comment.id), disabled: commentMutation.isPending });
            }

            if (!comment.canEdit) {
              const preview = comment.body.trim().replace(/\s+/g, " ").slice(0, 60);
              menuItems.push({
                label: "신고",
                tone: "danger",
                onSelect: () =>
                  setReportTarget({
                    type: "comment",
                    id: comment.id,
                    label: preview ? `${comment.author.nickname}님의 댓글: ${preview}` : `${comment.author.nickname}님의 댓글`,
                    url: `/${post.id}#comment-${comment.id}`,
                  }),
                disabled: commentMutation.isPending,
              });
            }

            return (
              <article
                key={comment.id}
                id={`comment-${comment.id}`}
                className={[
                  "rounded-3xl border border-(--border) bg-(--surface-raised) p-5 shadow-(--shadow)",
                  comment.isAccepted ? "ring-1 ring-(--accent)" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={getProfileHref(comment.author)}
                        className={[
                          "font-semibold transition hover:text-(--accent)",
                          isPostAuthorComment ? "rounded-md bg-[rgba(255,229,130,0.32)] px-2 py-0.5" : "",
                        ].join(" ")}
                      >
                        {comment.author.nickname}
                      </Link>
                      <span className="text-sm text-(--muted)">{comment.author.role}</span>
                      <span className="text-sm text-(--muted)">· {formatDateTime(comment.createdAt)}</span>
                      {isEdited ? <span className="text-sm text-(--muted)">· 수정됨</span> : null}
                      {comment.isAccepted ? (
                        <span className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--accent-soft) px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-(--accent)">
                          {getAcceptedBadgeLabel(post.category)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {menuItems.length ? (
                    <CommentActionsMenu
                      disabled={commentMutation.isPending}
                      items={menuItems}
                    />
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      value={editingCommentBody}
                      maxLength={1200}
                      tone="base"
                      radius="xl"
                      onChange={(event) => setEditingCommentBody(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                          event.preventDefault();
                          saveCommentEdit(comment.id);
                        }
                      }}
                      className="min-h-[124px] leading-7"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-(--muted)">수정 후 `Ctrl + Enter` 또는 `Cmd + Enter`로 저장할 수 있습니다.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={cancelEditingComment} disabled={commentMutation.isPending}>
                          취소
                        </Button>
                        <Button type="button" variant="primary" size="sm" onClick={() => saveCommentEdit(comment.id)} disabled={!editingCommentBody.trim() || commentMutation.isPending}>
                          {isEditingPending(comment.id) ? "저장 중..." : "수정 저장"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-(--muted-strong)">{comment.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-(--muted)">
                      <span>좋아요 {comment.likeCount}</span>
                      {isDeletingPending(comment.id) ? <span>삭제 중...</span> : null}
                      {isAcceptingPending(comment.id) ? <span>{comment.isAccepted ? "채택 취소 중..." : "채택 중..."}</span> : null}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-(--border) bg-(--surface-raised) p-6 text-sm text-(--muted-strong)">아직 댓글이 없습니다. 첫 번째 댓글을 남겨 대화를 시작해보세요.</div>
      )}
      <ReportDialog
        target={reportTarget}
        open={Boolean(reportTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReportTarget(null);
        }}
      />
    </section>
  );
}
