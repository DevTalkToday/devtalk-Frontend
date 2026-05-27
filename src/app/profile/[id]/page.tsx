"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { PostCard } from "@/components/devtalk/post-card";
import { FetchGet } from "@/lib/api/fetch";
import { CATEGORY_LABELS, type PostCategory, type PostSummary } from "@/lib/posts/types";

type PublicProfileUser = {
  id: number | string;
  username: string;
  email: string | null;
  nickname: string;
  description: string | null;
  avatarUrl: string | null;
  majors: string[];
  createdAt: string;
};

type PublicProfileResponse = {
  user: PublicProfileUser;
  postCount: number;
  commentCount: number;
  acceptedCommentCount: number;
};

type PostsResponse = {
  items: PostSummary[];
};

type ProfileComment = {
  id: string;
  postTitle: string;
  postCategory: PostCategory;
  targetUrl: string;
  body: string;
  createdAt: string;
  accepted: boolean;
};

type CommentsResponse = {
  items: ProfileComment[];
};

type ProfileTab = "posts" | "comments";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "posts", label: "게시글" },
  { id: "comments", label: "댓글" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "가입일 정보 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "가입일 정보 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const isBotProfile = (user: PublicProfileUser) => {
  const marker = `${user.username} ${user.nickname}`.toLowerCase();
  return marker.includes("devtalk") || marker.includes("bot") || marker.includes("seed_writer");
};

const getProfileIdentifier = (user: PublicProfileUser) => {
  const username = user.username?.trim();
  if (isBotProfile(user)) return username ? `@${username}` : "";

  return user.email?.trim() || (username ? `@${username}` : "");
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const profileQuery = useQuery({
    queryKey: ["profile", id],
    enabled: Boolean(id),
    queryFn: () => FetchGet(`/profile/${id}`) as Promise<PublicProfileResponse>,
  });

  const postsQuery = useQuery({
    queryKey: ["profile", id, "posts"],
    enabled: Boolean(id),
    queryFn: () => FetchGet(`/profile/${id}/posts?page=1&limit=24`) as Promise<PostsResponse>,
  });

  const commentsQuery = useQuery({
    queryKey: ["profile", id, "comments"],
    enabled: Boolean(id),
    queryFn: () => FetchGet(`/profile/${id}/comments?page=1&limit=24`) as Promise<CommentsResponse>,
  });

  const profile = profileQuery.data;
  const user = profile?.user;
  const nickname = user?.nickname?.trim() || "사용자";
  const description = user?.description?.trim() || "아직 등록된 설명이 없습니다.";
  const majors = useMemo(() => user?.majors?.filter(Boolean) ?? [], [user?.majors]);
  const profileIdentifier = user ? getProfileIdentifier(user) : "";
  const avatarInitial = nickname.slice(0, 1).toUpperCase() || "U";
  const posts = postsQuery.data?.items ?? [];
  const comments = commentsQuery.data?.items ?? [];

  return (
    <AppShell showPageHeader={false}>
      {profileQuery.isLoading ? (
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
          프로필을 불러오는 중입니다.
        </section>
      ) : null}

      {profileQuery.isError || !user ? (
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
          프로필을 찾지 못했습니다.
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-6 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={`${nickname} 프로필 이미지`}
                  className="size-36 rounded-full border border-(--border) bg-(--surface-raised) object-cover shadow-(--shadow)"
                />
              ) : (
                <div className="grid size-36 place-items-center rounded-full border border-(--border) bg-(--accent-soft) text-5xl font-bold text-(--accent) shadow-(--shadow)">
                  {avatarInitial}
                </div>
              )}
            </div>

            <div className="grid gap-5">
              <div>
                <h1 className="break-words text-3xl font-semibold md:text-4xl">{nickname}</h1>
                {profileIdentifier ? <p className="mt-2 break-words text-sm text-(--muted-strong)">{profileIdentifier}</p> : null}
              </div>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">게시글</dt>
                  <dd className="mt-2 text-sm font-semibold">{profile.postCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">댓글</dt>
                  <dd className="mt-2 text-sm font-semibold">{profile.commentCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">가입일</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatDate(user.createdAt)}</dd>
                </div>
              </dl>

              <div className="grid gap-3">
                <p className="whitespace-pre-line rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm leading-7 text-(--muted-strong)">
                  {description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {majors.length ? (
                    majors.map((major) => (
                      <span
                        key={major}
                        className="rounded-full border border-(--border) bg-(--accent-soft) px-3 py-1.5 text-xs font-semibold text-(--accent)"
                      >
                        {major}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-(--muted-strong)">전공 정보 없음</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-(--border) bg-(--surface) p-3 shadow-(--shadow) backdrop-blur-[18px]">
            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "min-h-12 rounded-[18px] px-3 text-sm font-semibold transition duration-150",
                    activeTab === tab.id
                      ? "border border-(--accent) bg-(--accent-soft) text-(--foreground)"
                      : "border border-transparent text-(--muted-strong) hover:bg-(--surface-raised) hover:text-(--foreground)",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-3 border-t border-(--border) px-3 py-5">
              {activeTab === "posts" ? (
                <div className="grid gap-4">
                  {postsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">게시글을 불러오는 중입니다.</p> : null}
                  {postsQuery.isError ? <p className="text-sm text-(--danger)">게시글을 불러오지 못했습니다.</p> : null}
                  {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? (
                    <p className="text-sm text-(--muted-strong)">작성한 게시글이 없습니다.</p>
                  ) : null}
                  {!postsQuery.isLoading && !postsQuery.isError
                    ? posts.map((post) => <PostCard key={post.id} post={post} />)
                    : null}
                </div>
              ) : (
                <div className="grid gap-3">
                  {commentsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">댓글을 불러오는 중입니다.</p> : null}
                  {commentsQuery.isError ? <p className="text-sm text-(--danger)">댓글을 불러오지 못했습니다.</p> : null}
                  {!commentsQuery.isLoading && !commentsQuery.isError && comments.length === 0 ? (
                    <p className="text-sm text-(--muted-strong)">작성한 댓글이 없습니다.</p>
                  ) : null}
                  {!commentsQuery.isLoading && !commentsQuery.isError
                    ? comments.map((comment) => (
                        <article key={comment.id} className="grid gap-3 rounded-[20px] border border-(--border) bg-(--surface-raised) p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link href={comment.targetUrl} className="font-semibold transition hover:text-(--accent)">
                              {comment.postTitle}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                                {CATEGORY_LABELS[comment.postCategory]}
                              </span>
                              {comment.accepted ? (
                                <span className="rounded-full border border-(--accent) bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent)">
                                  채택됨
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="whitespace-pre-line text-sm leading-7 text-(--muted-strong)">{comment.body}</p>
                          <p className="text-xs text-(--muted-strong)">{formatDate(comment.createdAt)}</p>
                        </article>
                      ))
                    : null}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
