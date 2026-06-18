"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, startTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { PostCard } from "@/components/devtalk/post-card";
import { Button, buttonClassName, chipButtonClassName } from "@/components/ui";
import { FetchGet } from "@/lib/api/fetch";
import { formatRelativePostDate } from "@/lib/date/relative";
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

const LATEST_POSTS_HEADING = "\uCD5C\uC2E0 \uAC8C\uC2DC\uAE00";
const WRITE_LABEL = "\uAE00 \uC791\uC131";
const POSTS_LOADING = "\uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
const POSTS_ERROR = "\uAC8C\uC2DC\uAE00 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const EMPTY_POSTS_TITLE = "\uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4";
const EMPTY_POSTS_DESCRIPTION =
  "\uAC80\uC0C9\uC5B4\uB97C \uBC14\uAFB8\uAC70\uB098 \uC0C8 \uAC8C\uC2DC\uAE00\uC744 \uC791\uC131\uD574 \uC8FC\uC138\uC694.";
const PAGE_INFO_LABEL = (totalCount: number, page: number, totalPages: number) =>
  `\uCD1D ${totalCount}\uAC1C \uC911 ${page} / ${totalPages} \uD398\uC774\uC9C0`;
const PREVIOUS_LABEL = "\uC774\uC804";
const NEXT_LABEL = "\uB2E4\uC74C";
const HELP_WANTED_BADGE = "\uB3C4\uC6C0 \uD544\uC694";
const HELP_WANTED_PANEL_TITLE = "\uB3C4\uC640\uC8FC\uC138\uC694!";
const HELP_WANTED_PANEL_META = "\uCD5C\uC2E0 5\uAC1C";
const HELP_WANTED_LOADING = "\uB3C4\uC6C0 \uD544\uC694 \uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
const HELP_WANTED_ERROR = "\uB3C4\uC6C0 \uD544\uC694 \uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const HELP_WANTED_EMPTY = "\uD45C\uC2DC\uD560 \uB3C4\uC6C0 \uD544\uC694 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.";
const COMMENTS_LABEL = (count: number) => `\uB313\uAE00 ${count}`;
const SUSPENSE_FALLBACK = "\uAC8C\uC2DC\uAE00\uC744 \uC900\uBE44\uD558\uB294 \uC911\uC785\uB2C8\uB2E4.";

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

function HelpWantedPostItem({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/${post.id}`}
      className="grid gap-2 rounded-2xl border border-(--border) bg-(--surface-raised) p-4 transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft)"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex w-fit items-center rounded-full border border-(--bug-border) bg-(--bug-bg) px-2.5 py-1 text-[11px] font-semibold text-(--bug-text)">
          {HELP_WANTED_BADGE}
        </span>
        <span className="text-xs text-(--muted-strong)">{formatRelativePostDate(post.createdAt)}</span>
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-6">{post.title}</h3>
      <p className="line-clamp-2 text-xs leading-5 text-(--muted-strong)">{post.excerpt}</p>
      <div className="flex items-center justify-between gap-3 text-xs text-(--muted-strong)">
        <span>{post.author.nickname}</span>
        <span>{COMMENTS_LABEL(post.commentCount)}</span>
      </div>
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

  const helpWantedPath = `/posts?${new URLSearchParams({
    category: "bug",
    resolution: "unresolved",
    sort: "latest",
    page: "1",
    limit: "5",
  }).toString()}`;

  const latestQuery = useQuery({
    queryKey: ["posts", "home-latest", query, page],
    queryFn: () => fetchPosts(latestPath),
    placeholderData: keepPreviousData,
  });

  const helpWantedQuery = useQuery({
    queryKey: ["posts", "home-help-wanted"],
    queryFn: () => fetchPosts(helpWantedPath),
  });

  const latestItems = latestQuery.data?.items ?? [];
  const helpWantedItems = helpWantedQuery.data?.items ?? [];
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
              <h1 className="text-2xl font-semibold md:text-3xl">{LATEST_POSTS_HEADING}</h1>
            </div>
            <Link href="/write" className={buttonClassName({ variant: "primary", className: "write-action-button" })}>
              <Image src="/pencil.svg" alt="" width={16} height={16} className="write-action-icon size-4" />
              {WRITE_LABEL}
            </Link>
          </div>

          {latestQuery.isLoading ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
              {POSTS_LOADING}
            </div>
          ) : null}

          {latestQuery.isError ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
              {POSTS_ERROR}
            </div>
          ) : null}

          {!latestQuery.isLoading && !latestQuery.isError && latestItems.length === 0 ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
              <h2 className="text-lg font-semibold">{EMPTY_POSTS_TITLE}</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted-strong)">{EMPTY_POSTS_DESCRIPTION}</p>
            </div>
          ) : null}

          {!latestQuery.isLoading && !latestQuery.isError
            ? latestItems.map((item) => <PostCard key={item.id} post={item} />)
            : null}

          {pageInfo ? (
            <div className="flex flex-col gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-(--muted-strong)">
                {PAGE_INFO_LABEL(pageInfo.totalCount, pageInfo.page, pageInfo.totalPages)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={!pageInfo.hasPreviousPage}
                  onClick={() => applyPage(pageInfo.page - 1)}
                >
                  {PREVIOUS_LABEL}
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
                  {NEXT_LABEL}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) backdrop-blur-[18px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{HELP_WANTED_PANEL_TITLE}</h2>
              <span className="text-xs font-semibold text-(--muted-strong)">{HELP_WANTED_PANEL_META}</span>
            </div>

            <div className="grid gap-3">
              {helpWantedQuery.isLoading ? (
                <p className="text-sm text-(--muted-strong)">{HELP_WANTED_LOADING}</p>
              ) : null}
              {helpWantedQuery.isError ? (
                <p className="text-sm text-(--danger)">{HELP_WANTED_ERROR}</p>
              ) : null}
              {!helpWantedQuery.isLoading && !helpWantedQuery.isError && helpWantedItems.length === 0 ? (
                <p className="text-sm text-(--muted-strong)">{HELP_WANTED_EMPTY}</p>
              ) : null}
              {!helpWantedQuery.isLoading && !helpWantedQuery.isError
                ? helpWantedItems.map((item) => <HelpWantedPostItem key={item.id} post={item} />)
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
    <Suspense fallback={<div className="p-6 text-sm text-(--muted-strong)">{SUSPENSE_FALLBACK}</div>}>
      <HomePageContent />
    </Suspense>
  );
}
