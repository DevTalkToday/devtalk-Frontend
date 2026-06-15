export const POST_CATEGORIES = ["qna", "bug", "discussion", "talk"] as const;
export const POST_SORT_OPTIONS = ["latest", "oldest", "popular", "views", "comments"] as const;
export const POST_RESOLUTION_FILTERS = ["all", "resolved", "unresolved"] as const;
export const BUG_STATUSES = ["open", "investigating", "fixed", "closed"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];
export type PostSortOption = (typeof POST_SORT_OPTIONS)[number];
export type PostResolutionFilter = (typeof POST_RESOLUTION_FILTERS)[number];
export type BugStatus = (typeof BUG_STATUSES)[number];

export type PostAuthor = {
  id: string;
  nickname: string;
  role: string;
  avatarUrl: string | null;
};

export type PostComment = {
  id: string;
  author: PostAuthor;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  liked: boolean;
  isAccepted?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canAccept?: boolean;
};

export type QuestionMeta = {
  solved: boolean;
  expected: string;
  actual: string;
  reproductionSteps: string[];
  acceptedCommentId: string | null;
};

export type BugMeta = {
  status: BugStatus;
  expected: string;
  actual: string;
  reproductionSteps: string[];
  watchers: number;
  acceptedCommentId: string | null;
  priority?: string;
  assignee?: string;
  environment?: string;
  labels?: string[];
};

export type QuestionPayload = {
  expected: string;
  actual: string;
  reproductionSteps: string[];
  acceptedCommentId?: string | null;
  solved?: boolean;
  environment?: string;
  tried?: string;
};

export type BugPayload = {
  status: BugStatus;
  expected: string;
  actual: string;
  reproductionSteps: string[];
  watchers?: number;
  acceptedCommentId?: string | null;
  priority?: string;
  assignee?: string;
  environment?: string;
  labels?: string[];
};

export type PostDetail = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  likeCount: number;
  bookmarkCount: number;
  bookmarked: boolean;
  liked: boolean;
  viewCount: number;
  tags: string[];
  majors: string[];
  comments: PostComment[];
  question?: QuestionMeta;
  bug?: BugMeta;
  canEdit?: boolean;
  canDelete?: boolean;
  canAcceptComments?: boolean;
};

export type PostSummary = Omit<PostDetail, "content" | "comments">;

export type PostPayload = {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  majors: string[];
  question?: QuestionPayload;
  bug?: BugPayload;
};

export type CommentPayload = {
  body: string;
};

export type CommentAcceptPayload = {
  accepted: boolean;
};

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  qna: "해결 기록",
  bug: "도움 필요",
  discussion: "토론",
  talk: "나만 보기",
};

export const SORT_LABELS: Record<PostSortOption, string> = {
  latest: "최신순",
  oldest: "오래된순",
  popular: "공감순",
  views: "조회순",
  comments: "댓글순",
};

export const RESOLUTION_FILTER_LABELS: Record<PostResolutionFilter, string> = {
  all: "전체",
  resolved: "해결됨",
  unresolved: "미해결",
};

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  open: "미해결",
  investigating: "분석 중",
  fixed: "수정됨",
  closed: "해결됨",
};
