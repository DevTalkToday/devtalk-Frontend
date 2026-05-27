"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { ArrowLeftIcon } from "@/components/devtalk/icons";
import { PostForm } from "@/components/devtalk/post-form";
import { buttonClassName } from "@/components/ui";
import { FetchGet } from "@/lib/api/fetch";
import { CATEGORY_LABELS, type PostDetail } from "@/lib/posts/types";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["post-edit", id],
    queryFn: () => FetchGet(`/posts/${id}?track=false`),
    enabled: Boolean(id),
  });

  const post = data as PostDetail | undefined;

  return (
    <AppShell
      title={post ? `${CATEGORY_LABELS[post.category]} 수정` : "게시글 수정"}
      description="기존 메타와 댓글은 유지하고, 본문과 카테고리별 필드를 갱신하는 편집 화면입니다."
      actions={
        <Link
          href={post ? `/${post.id}` : "/"}
          className={buttonClassName()}
        >
          <ArrowLeftIcon className="size-4" />
          돌아가기
        </Link>
      }
      sidebar={
        post ? (
          <div className="grid gap-3 pt-2">
            <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">Editing</span>
              <strong className="text-lg">{post.title}</strong>
              <span className="text-sm text-(--muted-strong)">{CATEGORY_LABELS[post.category]} 글 편집 중</span>
            </div>
          </div>
        ) : null
      }
    >
      {isLoading ? (
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow) backdrop-blur-[18px]">
          게시글을 불러오는 중입니다...
        </section>
      ) : null}
      {isError || !post ? (
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow) backdrop-blur-[18px]">
          수정할 게시글을 찾지 못했습니다.
        </section>
      ) : null}
      {post && !post.canEdit ? (
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow) backdrop-blur-[18px]">
          이 게시글을 수정할 권한이 없습니다.
        </section>
      ) : null}
      {post?.canEdit ? <PostForm mode="edit" postId={post.id} initialPost={post} /> : null}
    </AppShell>
  );
}
