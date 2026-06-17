"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, startTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { PostCard } from "@/components/devtalk/post-card";
import { Button, buttonClassName, chipButtonClassName } from "@/components/ui";
import { FetchGet } from "@/lib/api/fetch";
import { startNavigationProgress } from "@/lib/navigation/progress";
import { type PostSummary } from "@/lib/posts/types";

type PostsResponse = {
  items: PostSummary[];
  pageInfo: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const buildPages = (current: number, total: number) => {
  const pages: Array<number | "ellipsis"> = [];

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  pages.push(1);
  if (current > 4) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let value = start; value <= end; value += 1) pages.push(value);

  if (current < total - 3) pages.push("ellipsis");
  pages.push(total);

  return pages;
};

const fetchPosts = (path: string) => FetchGet(path) as Promise<PostsResponse>;

function PopularPostItem({ post, index }: { post: PostSummary; index: number }) {
  return (
    <Link
      href={`/${post.id}`}
      className="grid gap-2 rounded-2xl border border-(--border) bg-(--surface-raised) p-4 transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft)"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-(--accent)">#{index + 1}</span>
        <span className="text-xs text-(--muted-strong)">좋아요 {post.likeCount}</span>
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-6">{post.title}</h3>
      <p className="line-clamp-2 text-xs leading-5 text-(--muted-strong)">{post.excerpt}</p>
    </Link>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const page = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);

  const latestPath = `/posts?${new URLSearchParams({
    sort: "latest",
    page: String(page),
    limit: "6",
    ...(query ? { q: query } : {}),
  }).toString()}`;

  const popularPath = `/posts?${new URLSearchParams({
    sort: "popular",
    page: "1",
    limit: "5",
    ...(query ? { q: query } : {}),
  }).toString()}`;

  const latestQuery = useQuery({
    queryKey: ["posts", "home-latest", query, page],
    queryFn: () => fetchPosts(latestPath),
    placeholderData: keepPreviousData,
  });

  const popularQuery = useQuery({
    queryKey: ["posts", "home-popular", query],
    queryFn: () => fetchPosts(popularPath),
  });

  const latestItems = latestQuery.data?.items ?? [];
  const popularItems = popularQuery.data?.items ?? [];
  const pageInfo = latestQuery.data?.pageInfo;
  const pages = pageInfo ? buildPages(pageInfo.page, pageInfo.totalPages) : [];

  const applyPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (query) params.set("q", query);
    else params.delete("q");

    params.set("sort", "latest");
    params.set("page", String(nextPage));
    startNavigationProgress();
    startTransition(() => router.push(`/?${params.toString()}`));
  };

  return (
    <AppShell showPageHeader={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">최신 게시글</h1>
            </div>
            <Link href="/write" className={buttonClassName({ variant: "primary", className: "write-action-button" })}>
              <Image src="/pencil.svg" alt="" width={16} height={16} className="write-action-icon size-4" />
              글 작성
            </Link>
          </div>

          {latestQuery.isLoading ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
              게시글을 불러오는 중입니다.
            </div>
          ) : null}

          {latestQuery.isError ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
              게시글 목록을 불러오지 못했습니다.
            </div>
          ) : null}

          {!latestQuery.isLoading && !latestQuery.isError && latestItems.length === 0 ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
              <h2 className="text-lg font-semibold">게시글이 없습니다</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted-strong)">검색어를 바꾸거나 새 게시글을 작성해 주세요.</p>
            </div>
          ) : null}

          {!latestQuery.isLoading && !latestQuery.isError
            ? latestItems.map((item) => <PostCard key={item.id} post={item} />)
            : null}

          {pageInfo ? (
            <div className="flex flex-col gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-(--muted-strong)">
                총 {pageInfo.totalCount}개 중 {pageInfo.page} / {pageInfo.totalPages} 페이지
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={!pageInfo.hasPreviousPage}
                  onClick={() => applyPage(pageInfo.page - 1)}
                >
                  이전
                </Button>
                {pages.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`${item}-${index}`} className="px-2 text-sm text-(--muted)">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => applyPage(item)}
                      className={chipButtonClassName({ selected: item === pageInfo.page })}
                    >
                      {item}
                    </button>
                  )
                )}
                <Button
                  type="button"
                  disabled={!pageInfo.hasNextPage}
                  onClick={() => applyPage(pageInfo.page + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) backdrop-blur-[18px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">인기 게시글</h2>
              <span className="text-xs font-semibold text-(--muted-strong)">TOP 5</span>
            </div>

            <div className="grid gap-3">
              {popularQuery.isLoading ? (
                <p className="text-sm text-(--muted-strong)">인기 게시글을 불러오는 중입니다.</p>
              ) : null}
              {popularQuery.isError ? (
                <p className="text-sm text-(--danger)">인기 게시글을 불러오지 못했습니다.</p>
              ) : null}
              {!popularQuery.isLoading && !popularQuery.isError && popularItems.length === 0 ? (
                <p className="text-sm text-(--muted-strong)">표시할 인기 게시글이 없습니다.</p>
              ) : null}
              {!popularQuery.isLoading && !popularQuery.isError
                ? popularItems.map((item, index) => <PopularPostItem key={item.id} post={item} index={index} />)
                : null}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-(--muted-strong)">게시글을 준비하는 중입니다.</div>}>
      <HomePageContent />
    </Suspense>
  );
}
