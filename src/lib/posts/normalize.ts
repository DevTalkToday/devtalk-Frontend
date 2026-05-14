import {
  BUG_PRIORITIES,
  BUG_STATUSES,
  POST_CATEGORIES,
  type BugPriority,
  type BugStatus,
  type BugMeta,
  type CommentAcceptPayload,
  type CommentPayload,
  type PostCategory,
  type PostComment,
  type PostDetail,
  type PostPayload,
  type QuestionMeta,
} from "@/lib/posts/types";
import { normalizeMajorValues } from "@/lib/mock/majors";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => {
  if (value && typeof value === "object") return value as UnknownRecord;
  return {};
};

const trimText = (value: unknown) => String(value ?? "").trim();

const clampText = (value: unknown, max = 240) => trimText(value).slice(0, max);

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

const isCategory = (value: string): value is PostCategory =>
  POST_CATEGORIES.includes(value as PostCategory);

const isBugStatus = (value: string): value is BugStatus =>
  BUG_STATUSES.includes(value as BugStatus);

const isBugPriority = (value: string): value is BugPriority =>
  BUG_PRIORITIES.includes(value as BugPriority);

const buildQuestionMeta = (body: UnknownRecord, existing?: QuestionMeta): QuestionMeta => {
  const question = asRecord(body.question);

  return {
    solved: Boolean(question.solved),
    environment: clampText(question.environment, 180),
    tried: clampText(question.tried, 180),
    acceptedCommentId: existing?.acceptedCommentId ?? null,
  };
};

const buildBugMeta = (body: UnknownRecord, existing?: BugMeta): BugMeta => {
  const bug = asRecord(body.bug);
  const rawStatus = trimText(bug.status).toLowerCase();
  const rawPriority = trimText(bug.priority).toUpperCase();

  return {
    status: isBugStatus(rawStatus) ? rawStatus : existing?.status ?? "open",
    priority: isBugPriority(rawPriority) ? rawPriority : existing?.priority ?? "P2",
    assignee: clampText(bug.assignee, 80),
    environment: clampText(bug.environment, 180),
    expected: clampText(bug.expected, 240),
    actual: clampText(bug.actual, 240),
    reproductionSteps: cleanLines(bug.reproductionSteps),
    labels: cleanArray(bug.labels, 6),
    watchers: existing?.watchers ?? 0,
    acceptedCommentId: existing?.acceptedCommentId ?? null,
  };
};

export const createExcerpt = (content: string) =>
  content.replace(/\s+/g, " ").trim().slice(0, 150);

export const normalizePostPayload = (body: unknown, existing?: PostDetail): PostPayload => {
  const record = asRecord(body);
  const title = trimText(record.title).slice(0, 120);
  const content = String(record.content ?? "").trim();
  const rawCategory = trimText(record.category).toLowerCase();
  const category = isCategory(rawCategory) ? rawCategory : existing?.category ?? "talk";

  if (!title || !content) {
    throw new Error("TITLE_AND_CONTENT_REQUIRED");
  }

  const payload: PostPayload = {
    title,
    content,
    category,
    tags: cleanArray(record.tags, 8),
    majors: normalizeMajorValues(cleanArray(record.majors, 5), 5),
  };

  if (category === "qna") payload.question = buildQuestionMeta(record, existing?.question);
  if (category === "bug") payload.bug = buildBugMeta(record, existing?.bug);

  return payload;
};

export const normalizeCommentPayload = (body: unknown, existing?: PostComment): CommentPayload => {
  const record = asRecord(body);
  const commentBody = String(record.body ?? existing?.body ?? "").trim().slice(0, 1200);

  if (!commentBody) {
    throw new Error("COMMENT_BODY_REQUIRED");
  }

  return {
    body: commentBody,
  };
};

export const normalizeCommentAcceptPayload = (body: unknown): CommentAcceptPayload => {
  const record = asRecord(body);

  if (typeof record.accepted !== "boolean") {
    throw new Error("COMMENT_ACCEPTED_REQUIRED");
  }

  return {
    accepted: record.accepted,
  };
};
