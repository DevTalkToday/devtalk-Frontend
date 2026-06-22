import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/devtalk/app-shell";
import { PostCard } from "@/components/devtalk/post-card";
import { buttonClassName, chipButtonClassName } from "@/components/ui";
import { formatRelativePostDate } from "@/lib/date/relative";
import { normalizePostListResponse } from "@/lib/posts/response";
import { type PostSummary } from "@/lib/posts/types";
import { getServerApiBaseUrl } from "@/lib/site/config";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const LATEST_POSTS_HEADING = "최신 게시글";
const WRITE_LABEL = "글 작성";
const POSTS_ERROR = "게시글 목록을 불러오지 못했습니다.";
const EMPTY_POSTS_TITLE = "게시글이 없습니다";
const EMPTY_POSTS_DESCRIPTION = "검색어를 바꾸거나 새 게시글을 작성해 주세요.";
const PAGE_INFO_LABEL = (totalCount: number, page: number, totalPages: number) => `총 ${totalCount}개 중 ${page} / ${totalPages} 페이지`;
const PREVIOUS_LABEL = "이전";
const NEXT_LABEL = "다음";
const HELP_WANTED_BADGE = "도움 필요";
const HELP_WANTED_PANEL_TITLE = "도와주세요!";
const HELP_WANTED_PANEL_META = "최신 5개";
const HELP_WANTED_ERROR = "도움 필요 게시글을 불러오지 못했습니다.";
const HELP_WANTED_EMPTY = "표시할 도움 필요 게시글이 없습니다.";
const COMMENTS_LABEL = (count: number) => `댓글 ${count}`;

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

const getSearchValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

const buildPageHref = (page: number, query: string) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  params.set("sort", "latest");
  params.set("page", String(page));

  return `/?${params.toString()}`;
};

const buildApiUrl = (path: string) => {
  const baseUrl = getServerApiBaseUrl();
  if (!baseUrl) return null;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const fetchPostList = async (path: string) => {
  const url = buildApiUrl(path);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    return normalizePostListResponse(payload);
  } catch {
    return null;
  }
};

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams.q).trim();
  const rawPage = Number(getSearchValue(resolvedSearchParams.page) || "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

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

  const [latestResponse, helpWantedResponse] = await Promise.all([fetchPostList(latestPath), fetchPostList(helpWantedPath)]);

  const latestItems = latestResponse?.items ?? [];
  const helpWantedItems = helpWantedResponse?.items ?? [];
  const pageInfo = latestResponse?.pageInfo;
  const pages = pageInfo ? buildPages(pageInfo.page, pageInfo.totalPages) : [];

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

          {!latestResponse ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
              {POSTS_ERROR}
            </div>
          ) : null}

          {latestResponse && latestItems.length === 0 ? (
            <div className="rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
              <h2 className="text-lg font-semibold">{EMPTY_POSTS_TITLE}</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted-strong)">{EMPTY_POSTS_DESCRIPTION}</p>
            </div>
          ) : null}

          {latestItems.map((item) => (
            <PostCard key={item.id} post={item} />
          ))}

          {pageInfo ? (
            <div className="flex flex-col gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-(--muted-strong)">{PAGE_INFO_LABEL(pageInfo.totalCount, pageInfo.page, pageInfo.totalPages)}</p>
              <div className="flex flex-wrap items-center gap-2">
                {pageInfo.hasPreviousPage ? (
                  <Link href={buildPageHref(pageInfo.page - 1, query)} className={buttonClassName()}>
                    {PREVIOUS_LABEL}
                  </Link>
                ) : (
                  <span aria-disabled="true" className={buttonClassName({ className: "pointer-events-none" })}>
                    {PREVIOUS_LABEL}
                  </span>
                )}
                {pages.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`${item}-${index}`} className="px-2 text-sm text-(--muted)">
                      ...
                    </span>
                  ) : (
                    <Link key={item} href={buildPageHref(item, query)} className={chipButtonClassName({ selected: item === pageInfo.page })}>
                      {item}
                    </Link>
                  )
                )}
                {pageInfo.hasNextPage ? (
                  <Link href={buildPageHref(pageInfo.page + 1, query)} className={buttonClassName()}>
                    {NEXT_LABEL}
                  </Link>
                ) : (
                  <span aria-disabled="true" className={buttonClassName({ className: "pointer-events-none" })}>
                    {NEXT_LABEL}
                  </span>
                )}
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
              {!helpWantedResponse ? <p className="text-sm text-(--danger)">{HELP_WANTED_ERROR}</p> : null}
              {helpWantedResponse && helpWantedItems.length === 0 ? (
                <p className="text-sm text-(--muted-strong)">{HELP_WANTED_EMPTY}</p>
              ) : null}
              {helpWantedItems.map((item) => (
                <HelpWantedPostItem key={item.id} post={item} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
