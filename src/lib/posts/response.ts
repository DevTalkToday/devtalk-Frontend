import { normalizeMajorValues } from "@/lib/majors/normalize";
import { BUG_STATUSES, POST_CATEGORIES, type BugMeta, type BugStatus, type PostComment, type PostDetail, type PostSummary, type QuestionMeta } from "@/lib/posts/types";

type UnknownRecord = Record<string, unknown>;

type PostListPageInfo = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type PostListResponse = {
  items: PostSummary[];
  pageInfo: PostListPageInfo;
};

const asRecord = (value: unknown): UnknownRecord => {
  if (value && typeof value === "object") return value as UnknownRecord;
  return {};
};

const trimText = (value: unknown) => String(value ?? "").trim();

const clampText = (value: unknown, max = 240) => trimText(value).slice(0, max);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const cleanArray = (value: unknown, maxItems = 8) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => trimText(item))
    .filter(Boolean)
    .slice(0, maxItems);
};

const cleanLines = (value: unknown, maxItems = 8) => {
  if (Array.isArray(value)) return cleanArray(value, maxItems);

  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxItems);
};

const isCategory = (value: string): value is PostDetail["category"] =>
  POST_CATEGORIES.includes(value as PostDetail["category"]);

const isBugStatus = (value: string): value is BugStatus =>
  BUG_STATUSES.includes(value as BugStatus);

const normalizeQuestion = (value: unknown): QuestionMeta | undefined => {
  const question = asRecord(value);

  const expected = clampText(question.expected || question.environment, 240);
  const actual = clampText(question.actual || question.tried, 240);
  const reproductionSteps = cleanLines(question.reproductionSteps);
  const acceptedCommentId = trimText(question.acceptedCommentId) || null;
  const solved = toBoolean(question.solved, true);

  if (!expected && !actual && reproductionSteps.length === 0 && !acceptedCommentId) {
    return undefined;
  }

  return {
    solved,
    expected,
    actual,
    reproductionSteps,
    acceptedCommentId,
  };
};

const normalizeBug = (value: unknown): BugMeta | undefined => {
  const bug = asRecord(value);
  const rawStatus = trimText(bug.status).toLowerCase();
  const status = isBugStatus(rawStatus) ? rawStatus : "open";
  const expected = clampText(bug.expected, 240);
  const actual = clampText(bug.actual, 240);
  const reproductionSteps = cleanLines(bug.reproductionSteps);
  const acceptedCommentId = trimText(bug.acceptedCommentId) || null;

  if (!rawStatus && !expected && !actual && reproductionSteps.length === 0 && !acceptedCommentId && value == null) {
    return undefined;
  }

  return {
    status,
    expected,
    actual,
    reproductionSteps,
    watchers: toNumber(bug.watchers),
    acceptedCommentId,
    priority: trimText(bug.priority) || undefined,
    assignee: trimText(bug.assignee) || undefined,
    environment: trimText(bug.environment) || undefined,
    labels: cleanArray(bug.labels, 6),
  };
};

const normalizeAuthor = (value: unknown) => {
  const author = asRecord(value);

  return {
    id: trimText(author.id),
    nickname: trimText(author.nickname),
    role: trimText(author.role),
    avatarUrl: trimText(author.avatarUrl) || null,
  };
};

const normalizeComment = (value: unknown): PostComment => {
  const comment = asRecord(value);

  return {
    id: trimText(comment.id),
    author: normalizeAuthor(comment.author),
    body: String(comment.body ?? ""),
    createdAt: trimText(comment.createdAt),
    updatedAt: trimText(comment.updatedAt) || undefined,
    likeCount: toNumber(comment.likeCount),
    liked: toBoolean(comment.liked, false),
    isAccepted: toBoolean(comment.isAccepted, false),
    canEdit: toBoolean(comment.canEdit, false),
    canDelete: toBoolean(comment.canDelete, false),
    canAccept: toBoolean(comment.canAccept, false),
  };
};

const normalizeResolvedQuestionFromBug = (bug: BugMeta | undefined): QuestionMeta | undefined => {
  if (!bug) return undefined;

  return {
    solved: true,
    expected: bug.expected,
    actual: bug.actual,
    reproductionSteps: bug.reproductionSteps,
    acceptedCommentId: bug.acceptedCommentId,
  };
};

export const normalizePostDetailResponse = (value: unknown): PostDetail => {
  const post = asRecord(value);
  const rawCategory = trimText(post.category).toLowerCase();
  const bug = normalizeBug(post.bug);
  const legacyResolvedBug = rawCategory === "bug" && bug?.status === "closed";
  const category = legacyResolvedBug ? "qna" : (isCategory(rawCategory) ? rawCategory : "talk");
  const question = legacyResolvedBug ? normalizeResolvedQuestionFromBug(bug) : normalizeQuestion(post.question);
  const comments = Array.isArray(post.comments) ? post.comments.map(normalizeComment) : [];

  return {
    id: trimText(post.id),
    title: trimText(post.title),
    excerpt: String(post.excerpt ?? ""),
    content: String(post.content ?? ""),
    category,
    author: normalizeAuthor(post.author),
    createdAt: trimText(post.createdAt),
    updatedAt: trimText(post.updatedAt) || trimText(post.createdAt),
    commentCount: toNumber(post.commentCount, comments.length),
    likeCount: toNumber(post.likeCount),
    bookmarkCount: toNumber(post.bookmarkCount),
    bookmarked: toBoolean(post.bookmarked, false),
    liked: toBoolean(post.liked, false),
    viewCount: toNumber(post.viewCount),
    tags: cleanArray(post.tags, 8),
    majors: normalizeMajorValues(cleanArray(post.majors, 5), 5),
    comments,
    question: category === "qna" ? question : undefined,
    bug: category === "bug" ? bug : undefined,
    canEdit: toBoolean(post.canEdit, false),
    canDelete: toBoolean(post.canDelete, false),
    canAcceptComments: toBoolean(post.canAcceptComments, false),
  };
};

export const normalizePostSummaryResponse = (value: unknown): PostSummary => {
  const detail = normalizePostDetailResponse(value);

  return {
    id: detail.id,
    title: detail.title,
    excerpt: detail.excerpt,
    category: detail.category,
    author: detail.author,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    commentCount: detail.commentCount,
    likeCount: detail.likeCount,
    bookmarkCount: detail.bookmarkCount,
    bookmarked: detail.bookmarked,
    liked: detail.liked,
    viewCount: detail.viewCount,
    tags: detail.tags,
    majors: detail.majors,
    question: detail.question,
    bug: detail.bug,
    canEdit: detail.canEdit,
    canDelete: detail.canDelete,
    canAcceptComments: detail.canAcceptComments,
  };
};

export const normalizePostListResponse = (value: unknown): PostListResponse => {
  const record = asRecord(value);
  const pageInfo = asRecord(record.pageInfo);

  return {
    items: Array.isArray(record.items) ? record.items.map(normalizePostSummaryResponse) : [],
    pageInfo: {
      page: toNumber(pageInfo.page, 1),
      limit: toNumber(pageInfo.limit, 6),
      totalCount: toNumber(pageInfo.totalCount),
      totalPages: toNumber(pageInfo.totalPages, 1),
      hasNextPage: toBoolean(pageInfo.hasNextPage, false),
      hasPreviousPage: toBoolean(pageInfo.hasPreviousPage, false),
    },
  };
};

const extractPathname = (path: string) => {
  try {
    return new URL(path, "http://localhost").pathname;
  } catch {
    return path;
  }
};

export const normalizePostApiResponse = (path: string, payload: unknown) => {
  const pathname = extractPathname(path);
  if (!pathname.startsWith("/posts")) return payload;
  if (!payload || typeof payload !== "object") return payload;

  const record = asRecord(payload);
  if (Array.isArray(record.items) && record.pageInfo) {
    return normalizePostListResponse(payload);
  }

  if (record.id && record.title) {
    return normalizePostDetailResponse(payload);
  }

  return payload;
};
