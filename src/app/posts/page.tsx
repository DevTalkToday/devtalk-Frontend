"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, startTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { PostCard } from "@/components/devtalk/post-card";
import { Button, buttonClassName, chipButtonClassName } from "@/components/ui";
import { FetchGet } from "@/lib/api/fetch";
import {
  CATEGORY_LABELS,
  POST_CATEGORIES,
  POST_RESOLUTION_FILTERS,
  POST_SORT_OPTIONS,
  RESOLUTION_FILTER_LABELS,
  SORT_LABELS,
  type PostCategory,
  type PostResolutionFilter,
  type PostSortOption,
  type PostSummary,
} from "@/lib/posts/types";

type MatchMode = "and" | "or";

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

const isCategory = (value: string): value is PostCategory =>
  POST_CATEGORIES.includes(value as PostCategory);

const isResolutionFilter = (value: string): value is PostResolutionFilter =>
  POST_RESOLUTION_FILTERS.includes(value as PostResolutionFilter);

const isMatchMode = (value: string | null): value is MatchMode => value === "and" || value === "or";

const parseSelectedCategories = (value: string | null) => {
  const requested = (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(isCategory);

  return POST_CATEGORIES.filter((category) => requested.includes(category));
};

const parseSelectedResolutions = (value: string | null) => {
  const requested = (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(isResolutionFilter)
    .filter((item) => item !== "all");

  return POST_RESOLUTION_FILTERS.filter((item) => item !== "all" && requested.includes(item));
};

const serializeSelectedCategories = (categories: PostCategory[]) => categories.join(",");
const serializeSelectedResolutions = (resolutions: PostResolutionFilter[]) => resolutions.join(",");

function PostsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategories = parseSelectedCategories(searchParams.get("category"));
  const selectedResolutions = parseSelectedResolutions(searchParams.get("resolution"));
  const categoryKey = serializeSelectedCategories(selectedCategories);
  const resolutionKey = serializeSelectedResolutions(selectedResolutions);
  const query = searchParams.get("q") ?? "";
  const rawSort = (searchParams.get("sort") ?? "latest").trim().toLowerCase();
  const sort = POST_SORT_OPTIONS.includes(rawSort as PostSortOption) ? (rawSort as PostSortOption) : "latest";
  const rawMatch = searchParams.get("match");
  const match: MatchMode = isMatchMode(rawMatch) ? rawMatch : "and";
  const page = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);

  const params = new URLSearchParams();
  if (selectedCategories.length) params.set("category", categoryKey);
  if (selectedResolutions.length) params.set("resolution", resolutionKey);
  if (query) params.set("q", query);
  params.set("match", match);
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", "6");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", "posts-page", categoryKey || "all", resolutionKey || "all", match, query, sort, page],
    queryFn: () => FetchGet(`/posts?${params.toString()}`) as Promise<PostsResponse>,
  });

  const items = data?.items ?? [];
  const pageInfo = data?.pageInfo;
  const pages = pageInfo ? buildPages(pageInfo.page, pageInfo.totalPages) : [];

  const applyParams = (next: {
    categories?: PostCategory[];
    resolutions?: PostResolutionFilter[];
    sort?: PostSortOption;
    match?: MatchMode;
    page?: number;
  }) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const nextCategories = next.categories ?? selectedCategories;
    const nextResolutions = next.resolutions ?? selectedResolutions;
    const nextSort = next.sort ?? sort;
    const nextMatch = next.match ?? match;
    const nextPage = next.page ?? page;

    if (nextCategories.length) nextParams.set("category", serializeSelectedCategories(nextCategories));
    else nextParams.delete("category");

    if (nextResolutions.length) nextParams.set("resolution", serializeSelectedResolutions(nextResolutions));
    else nextParams.delete("resolution");

    if (query) nextParams.set("q", query);
    else nextParams.delete("q");

    nextParams.set("match", nextMatch);
    nextParams.set("sort", nextSort);
    nextParams.set("page", String(nextPage));
    startTransition(() => router.push(`/posts?${nextParams.toString()}`));
  };

  const toggleCategory = (category: PostCategory) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : POST_CATEGORIES.filter((item) => selectedCategories.includes(item) || item === category);

    applyParams({ categories: nextCategories, page: 1 });
  };

  const toggleResolution = (resolution: PostResolutionFilter) => {
    if (resolution === "all") {
      applyParams({ resolutions: [], page: 1 });
      return;
    }

    const nextResolutions = selectedResolutions.includes(resolution)
      ? selectedResolutions.filter((item) => item !== resolution)
      : POST_RESOLUTION_FILTERS.filter(
          (item) => item !== "all" && (selectedResolutions.includes(item) || item === resolution)
        );

    applyParams({ resolutions: nextResolutions, page: 1 });
  };

  return (
    <AppShell showPageHeader={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
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

          {isLoading ? (
            <div className="border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
              게시글을 불러오는 중입니다.
            </div>
          ) : null}

          {isError ? (
            <div className="border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
              게시글 목록을 불러오지 못했습니다.
            </div>
          ) : null}

          {!isLoading && !isError && items.length === 0 ? (
            <div className="border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
              <h2 className="text-lg font-semibold">게시글이 없습니다</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted-strong)">필터 조건을 조정해 주세요.</p>
            </div>
          ) : null}

          {!isLoading && !isError ? items.map((item) => <PostCard key={item.id} post={item} />) : null}

          {pageInfo ? (
            <div className="flex flex-col gap-4 border border-(--border) bg-(--surface) p-5 shadow-(--shadow) md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-(--muted-strong)">
                총 {pageInfo.totalCount}개 중 {pageInfo.page} / {pageInfo.totalPages} 페이지
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={!pageInfo.hasPreviousPage}
                  onClick={() => applyParams({ page: pageInfo.page - 1 })}
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
                      onClick={() => applyParams({ page: item })}
                      className={chipButtonClassName({ selected: item === pageInfo.page })}
                    >
                      {item}
                    </button>
                  )
                )}
                <Button type="button" disabled={!pageInfo.hasNextPage} onClick={() => applyParams({ page: pageInfo.page + 1 })}>
                  다음
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="border border-(--border) bg-(--surface) p-5 shadow-(--shadow) backdrop-blur-[18px]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">필터 설정</h2>
                <p className="mt-1 text-sm text-(--muted-strong)">목록 조건을 빠르게 조정합니다.</p>
              </div>
              <div className="flex gap-1 border border-(--border) bg-(--surface-raised) p-1">
                {(["and", "or"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => applyParams({ match: mode, page: 1 })}
                    className={[
                      "min-h-8 px-3 text-xs font-bold uppercase transition duration-150",
                      match === mode
                        ? "border border-(--accent) bg-(--accent-soft) text-(--foreground)"
                        : "text-(--muted-strong) hover:text-(--foreground)",
                    ].join(" ")}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <p className="text-sm font-semibold">기록 유형</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyParams({ categories: [], page: 1 })}
                    className={chipButtonClassName({ selected: selectedCategories.length === 0 })}
                  >
                    전체
                  </button>
                  {POST_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={chipButtonClassName({ selected: selectedCategories.includes(category) })}
                    >
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold">해결 상태</p>
                <div className="flex flex-wrap gap-2">
                  {POST_RESOLUTION_FILTERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleResolution(item)}
                      className={chipButtonClassName({
                        selected: item === "all" ? selectedResolutions.length === 0 : selectedResolutions.includes(item),
                      })}
                    >
                      {RESOLUTION_FILTER_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold">정렬</p>
                <div className="flex flex-wrap gap-2">
                  {POST_SORT_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => applyParams({ sort: item, page: 1 })}
                      className={chipButtonClassName({ selected: sort === item })}
                    >
                      {SORT_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-(--muted-strong)">게시글을 준비하는 중입니다.</div>}>
      <PostsPageContent />
    </Suspense>
  );
}
