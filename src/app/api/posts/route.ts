import { NextResponse } from "next/server";
import { normalizePostPayload } from "@/lib/posts/normalize";
import {
  POST_CATEGORIES,
  POST_RESOLUTION_FILTERS,
  POST_SORT_OPTIONS,
  type PostCategory,
  type PostResolutionFilter,
  type PostSortOption,
} from "@/lib/posts/types";
import { createPost, listPosts } from "./store";

const isCategory = (value: string): value is PostCategory =>
  POST_CATEGORIES.includes(value as PostCategory);

const isResolutionFilter = (value: string): value is PostResolutionFilter =>
  POST_RESOLUTION_FILTERS.includes(value as PostResolutionFilter);

const isSortOption = (value: string): value is PostSortOption =>
  POST_SORT_OPTIONS.includes(value as PostSortOption);

const isMatchMode = (value: string): value is "and" | "or" => value === "and" || value === "or";

export function GET(req: Request) {
  const url = new URL(req.url);
  const categories = (url.searchParams.get("category") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isCategory);
  const q = (url.searchParams.get("q") ?? "").trim();
  const rawSort = (url.searchParams.get("sort") ?? "latest").trim().toLowerCase();
  const sort = isSortOption(rawSort) ? rawSort : "latest";
  const resolutions = (url.searchParams.get("resolution") ?? "all")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isResolutionFilter);
  const selectedResolutions = resolutions.includes("all") ? ["all" as const] : resolutions;
  const rawMatch = (url.searchParams.get("match") ?? "and").trim().toLowerCase();
  const match = isMatchMode(rawMatch) ? rawMatch : "and";

  const page = Math.max(Number(url.searchParams.get("page") ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 6) || 6, 1), 24);

  const all = listPosts({ categories, q, sort, resolutions: selectedResolutions, match });
  const totalCount = all.length;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return NextResponse.json({
    items: all.slice(start, start + limit),
    pageInfo: {
      page: safePage,
      limit,
      totalCount,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const payload = normalizePostPayload(body);
    const post = createPost(payload);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "TITLE_AND_CONTENT_REQUIRED" ? 422 : 400;
    return NextResponse.json({ message }, { status });
  }
}
