"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { ArrowLeftIcon, BookmarkIcon, CommentIcon, EyeIcon, HeartIcon, PenIcon, TrashIcon } from "@/components/devtalk/icons";
import { MarkdownBody } from "@/components/devtalk/markdown-body";
import { PostComments } from "@/components/devtalk/post-comments";
import { ReportButton } from "@/components/devtalk/report-dialog";
import { Button, buttonClassName } from "@/components/ui";
import { FetchDeleteAuth, FetchGet, FetchPostAuth } from "@/lib/api/fetch";
import { BUG_STATUS_LABELS, CATEGORY_LABELS, type PostDetail } from "@/lib/posts/types";
import { getProfileHref } from "@/lib/profile/links";
import { useAuthStatus } from "@/lib/auth/session";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getHeadlineStatus = (post: PostDetail) => {
  if (post.category === "qna") return "해결됨";
  if (post.category === "bug") return post.bug ? BUG_STATUS_LABELS[post.bug.status] : "열림";
  return "기록 공유";
};

const getAcceptedCommentId = (post: PostDetail) => {
  if (post.category === "qna") return post.question?.acceptedCommentId ?? null;
  if (post.category === "bug") return post.bug?.acceptedCommentId ?? null;
  return null;
};

const metricClass = "inline-flex items-center gap-1.5";

export default function PostDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const trackedViewRef = useRef(false);
  const { ready, loggedIn } = useAuthStatus();
  const [deleting, setDeleting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    trackedViewRef.current = false;
  }, [id]);

  const { data: post, isLoading, isError } = useQuery<PostDetail>({
    queryKey: ["post", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const path = trackedViewRef.current ? `/posts/${id}?track=false` : `/posts/${id}`;
      const response = (await FetchGet(path)) as PostDetail;
      trackedViewRef.current = true;
      return response;
    },
  });

  const acceptedComment = useMemo(() => {
    if (!post) return null;
    const acceptedCommentId = getAcceptedCommentId(post);
    if (!acceptedCommentId) return null;
    return post.comments.find((comment) => comment.id === acceptedCommentId) ?? null;
  }, [post]);

  const authorProfileHref = getProfileHref(post?.author);

  const syncPost = (nextPost: PostDetail) => {
    queryClient.setQueryData(["post", id], nextPost);
    void queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const removePost = async () => {
    if (!id || deleting) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;

    setDeleting(true);

    try {
      await FetchDeleteAuth(`/posts/${id}`);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      startTransition(() => router.push("/"));
    } finally {
      setDeleting(false);
    }
  };

  const toggleBookmark = async () => {
    if (!post || bookmarking) return;
    if (ready && !loggedIn) {
      router.push("/login");
      return;
    }

    setBookmarking(true);
    try {
      const nextPost = (
        post.bookmarked
          ? await FetchDeleteAuth(`/posts/${post.id}/bookmark`)
          : await FetchPostAuth(`/posts/${post.id}/bookmark`)
      ) as PostDetail;
      syncPost(nextPost);
      void queryClient.invalidateQueries({ queryKey: ["profile", "posts"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", "bookmarks"] });
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <AppShell
      title={post ? `${CATEGORY_LABELS[post.category]}` : "기록 상세"}
      description={
        post
          ? `${CATEGORY_LABELS[post.category]} 상세입니다. 가이드라인을 위반하는 내용이 있다면 신고 버튼을 눌러 알려주세요.`
          : "기록을 불러오는 중입니다."
      }
      actions={
        <>
          <Link href="/" className={buttonClassName()}>
            <ArrowLeftIcon className="size-4" />
            피드로
          </Link>
          {post ? (
            <>
              <button
                type="button"
                onClick={toggleBookmark}
                disabled={bookmarking}
                className={buttonClassName({ variant: post.bookmarked ? "primary" : "surface" })}
              >
                <BookmarkIcon className="size-4" />
                {post.bookmarked ? "북마크됨" : "북마크"}
              </button>
              {post.canEdit ? (
                <Link href={`/${post.id}/edit`} className={buttonClassName()}>
                  <PenIcon className="size-4" />
                  수정
                </Link>
              ) : null}
              {post.canDelete ? (
                <Button type="button" variant="danger" onClick={removePost} disabled={deleting}>
                  <TrashIcon className="size-4" />
                  {deleting ? "삭제 중.." : "삭제"}
                </Button>
              ) : null}
              {!post.canEdit ? (
                <ReportButton
                  target={{
                    type: "post",
                    id: post.id,
                    label: post.title,
                    url: `/${post.id}`,
                  }}
                />
              ) : null}
            </>
          ) : null}
        </>
      }
    >
      {isLoading ? (
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow) backdrop-blur-[18px]">
          기록을 불러오는 중입니다...
        </section>
      ) : null}

      {!isLoading && (isError || !post) ? (
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow) backdrop-blur-[18px]">
          기록을 불러오지 못했습니다.
        </section>
      ) : null}

      {post ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] xl:items-start">
          <div className="space-y-6">
            <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex w-fit items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.02em]",
                    post.category === "qna"
                      ? "border-(--border) bg-(--accent-soft) text-(--accent)"
                      : post.category === "bug"
                        ? "border-(--bug-border) bg-(--bug-bg) text-(--bug-text)"
                        : "border-(--talk-border) bg-(--talk-bg) text-(--talk-text)",
                  ].join(" ")}
                >
                  {CATEGORY_LABELS[post.category]}
                </span>
                <span className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-(--muted-strong)">
                  {getHeadlineStatus(post)}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-[-0.05em]">{post.title}</h2>
                  <p className="text-sm leading-6 text-(--muted-strong)">
                    <Link href={authorProfileHref} className="font-semibold text-(--foreground) transition hover:text-(--accent)">
                      {post.author.nickname}
                    </Link>{" "}
                    / {post.author.role} / {formatDateTime(post.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-(--muted-strong)">
                  <span className={metricClass}>
                    <CommentIcon className="size-4" />
                    {post.commentCount}
                  </span>
                  <span className={metricClass}>
                    <HeartIcon className="size-4" />
                    {post.likeCount}
                  </span>
                  <span className={metricClass}>
                    <EyeIcon className="size-4" />
                    {post.viewCount}
                  </span>
                </div>
              </div>

              {(post.tags ?? []).length ? (
                <div className="flex flex-wrap gap-2">
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-(--muted-strong)"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <MarkdownBody value={post.content} />
            </section>

            <PostComments key={post.id} post={post} onPostChange={syncPost} />
          </div>

          <aside className="space-y-6">
            <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
              <p className="text-lg font-semibold tracking-[-0.03em]">기록 정보</p>
              <div className="grid gap-3 text-sm">
                <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">작성자</span>
                  <Link href={authorProfileHref} className="text-lg font-semibold transition hover:text-(--accent)">
                    {post.author.nickname}
                  </Link>
                  <span className="text-(--muted-strong)">{post.author.role}</span>
                </div>
                <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">영역</span>
                  <strong className="text-lg">{post.majors.length ? post.majors.join(", ") : "미설정"}</strong>
                  <span className="text-(--muted-strong)">검색과 분류에 사용하는 메타 정보</span>
                </div>
              </div>
            </section>

            {post.category === "qna" && post.question ? (
              <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
                <p className="text-lg font-semibold tracking-[-0.03em]">해결 기록 요약</p>
                <div className="grid gap-3 text-sm">
                  <InfoCard label="Expected" value={post.question.expected || "미입력"} help="기대 결과" />
                  <InfoCard label="Actual" value={post.question.actual || "미입력"} help="실제 결과" />
                  <InfoCard
                    label="Accepted"
                    value={
                      acceptedComment ? (
                        <Link href={getProfileHref(acceptedComment.author)} className="transition hover:text-(--accent)">
                          {acceptedComment.author.nickname}
                        </Link>
                      ) : (
                        "아직 없음"
                      )
                    }
                    help={acceptedComment ? "채택된 댓글입니다." : "채택된 댓글이 없습니다."}
                  />
                </div>
                <div className="rounded-3xl border border-(--border) bg-(--surface-raised) p-5 shadow-(--shadow)">
                  <p className="text-sm font-semibold">재현 절차</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-(--muted-strong)">
                    {(post.question.reproductionSteps ?? []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </section>
            ) : null}

            {post.category === "bug" && post.bug ? (
              <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
                <p className="text-lg font-semibold tracking-[-0.03em]">도움 필요 요약</p>
                <div className="grid gap-3">
                  <InfoCard label="Status" value={BUG_STATUS_LABELS[post.bug.status]} help="현재 처리 상태" />
                  <InfoCard label="Expected" value={post.bug.expected || "미입력"} help="기대 동작" />
                  <InfoCard label="Actual" value={post.bug.actual || "미입력"} help="실제 결과" />
                </div>
                <div className="rounded-3xl border border-(--border) bg-(--surface-raised) p-5 shadow-(--shadow)">
                  <p className="text-sm font-semibold">재현 절차</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-(--muted-strong)">
                    {(post.bug.reproductionSteps ?? []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}

function InfoCard({ label, value, help }: { label: string; value: ReactNode; help: string }) {
  return (
    <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">{label}</span>
      <strong className="text-base">{value}</strong>
      <span className="text-(--muted-strong)">{help}</span>
    </div>
  );
}
