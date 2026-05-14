import { posts as seedPosts } from "@/lib/mock/posts";
import { normalizeMajorValues } from "@/lib/mock/majors";
import { createExcerpt } from "@/lib/posts/normalize";
import type {
  CommentPayload,
  PostAuthor,
  PostCategory,
  PostComment,
  PostDetail,
  PostPayload,
  PostResolutionFilter,
  PostSortOption,
  PostSummary,
} from "@/lib/posts/types";

const viewerAuthor: PostAuthor = {
  id: "viewer",
  nickname: "You",
  role: "Frontend Builder",
  avatarUrl: null,
};

const cloneComment = (comment: PostComment): PostComment => ({
  ...comment,
  author: { ...comment.author },
});

const clonePost = (post: PostDetail): PostDetail => ({
  ...post,
  author: { ...post.author },
  tags: [...post.tags],
  majors: normalizeMajorValues(post.majors),
  comments: post.comments.map(cloneComment),
  question: post.question ? { ...post.question } : undefined,
  bug: post.bug
    ? {
        ...post.bug,
        labels: [...post.bug.labels],
        reproductionSteps: [...post.bug.reproductionSteps],
      }
    : undefined,
});

const toTime = (value: string) => new Date(value).getTime();

const compareLatest = (left: PostDetail, right: PostDetail) =>
  toTime(right.createdAt) - toTime(left.createdAt) ||
  toTime(right.updatedAt) - toTime(left.updatedAt);

const compareOldest = (left: PostDetail, right: PostDetail) =>
  toTime(left.createdAt) - toTime(right.createdAt) ||
  toTime(left.updatedAt) - toTime(right.updatedAt);

const isResolvedPost = (post: PostDetail) => {
  if (post.category === "qna") return Boolean(post.question?.solved);
  if (post.category === "bug") return post.bug ? post.bug.status === "fixed" || post.bug.status === "closed" : false;
  return null;
};

const matchesResolutionFilter = (post: PostDetail, resolutions: PostResolutionFilter[]) => {
  if (!resolutions.length || resolutions.includes("all")) return true;

  const resolved = isResolvedPost(post);
  if (resolved === null) return false;

  return resolutions.some((resolution) => (resolution === "resolved" ? resolved : !resolved));
};

let posts: PostDetail[] = seedPosts.map(clonePost);

const sortPosts = (items: PostDetail[], sort: PostSortOption) => {
  const copy = [...items];

  copy.sort((left, right) => {
    if (sort === "popular") return right.likeCount - left.likeCount || compareLatest(left, right);
    if (sort === "views") return right.viewCount - left.viewCount || compareLatest(left, right);
    if (sort === "comments") return right.commentCount - left.commentCount || compareLatest(left, right);
    if (sort === "oldest") return compareOldest(left, right);
    return compareLatest(left, right);
  });

  return copy;
};

const syncCommentMeta = (post: PostDetail, comments: PostComment[]): PostDetail => {
  const acceptedCommentId = comments.find((comment) => comment.isAccepted)?.id ?? null;

  return {
    ...post,
    commentCount: comments.length,
    comments,
    question:
      post.category === "qna" && post.question
        ? {
            ...post.question,
            solved: Boolean(acceptedCommentId),
            acceptedCommentId,
          }
        : post.question,
    bug:
      post.category === "bug" && post.bug
        ? {
            ...post.bug,
            acceptedCommentId,
          }
        : post.bug,
  };
};

const replacePost = (id: string, updater: (post: PostDetail) => PostDetail | null) => {
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const next = updater(clonePost(posts[index]));
  if (!next) return null;

  posts = [...posts.slice(0, index), next, ...posts.slice(index + 1)];
  return next;
};

export const summarizePost = (post: PostDetail): PostSummary => ({
  ...post,
  commentCount: post.comments.length,
});

export const listPosts = ({
  categories,
  q,
  sort,
  resolution,
  resolutions,
  match = "and",
}: {
  categories?: PostCategory[];
  q?: string;
  sort: PostSortOption;
  resolution?: PostResolutionFilter;
  resolutions?: PostResolutionFilter[];
  match?: "and" | "or";
}) => {
  const keywords = (q ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const selectedResolutions = resolutions ?? (resolution ? [resolution] : ["all"]);
  const hasCategoryFilter = Boolean(categories?.length);
  const hasResolutionFilter = selectedResolutions.length > 0 && !selectedResolutions.includes("all");

  const filtered = posts
    .filter((post) => {
      const categoryMatch = hasCategoryFilter ? categories!.includes(post.category) : true;
      const resolutionMatch = matchesResolutionFilter(post, selectedResolutions);

      if (match === "or" && (hasCategoryFilter || hasResolutionFilter)) {
        return (hasCategoryFilter && categoryMatch) || (hasResolutionFilter && resolutionMatch);
      }

      return categoryMatch && resolutionMatch;
    })
    .filter((post) => {
      if (!keywords.length) return true;

      const haystack = [
        post.title,
        post.excerpt,
        post.content,
        post.tags.join(" "),
        post.majors.join(" "),
        post.question?.environment,
        post.question?.tried,
        post.bug?.environment,
        post.bug?.expected,
        post.bug?.actual,
        post.bug?.labels.join(" "),
        ...post.comments.map((comment) => comment.body),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return match === "or"
        ? keywords.some((keyword) => haystack.includes(keyword))
        : keywords.every((keyword) => haystack.includes(keyword));
    });

  return sortPosts(filtered, sort).map(summarizePost);
};

export const getPostById = (id: string) => posts.find((post) => post.id === id);

export const createPost = (payload: PostPayload) => {
  const createdAt = new Date().toISOString();
  const id = String(Date.now());

  const post: PostDetail = {
    id,
    title: payload.title,
    excerpt: createExcerpt(payload.content),
    content: payload.content,
    category: payload.category,
    author: viewerAuthor,
    createdAt,
    updatedAt: createdAt,
    commentCount: 0,
    likeCount: 0,
    bookmarkCount: 0,
    viewCount: 0,
    tags: payload.tags,
    majors: normalizeMajorValues(payload.majors),
    comments: [],
    question: payload.question,
    bug: payload.bug,
  };

  posts = [post, ...posts];
  return post;
};

export const updatePost = (id: string, payload: PostPayload) => {
  const current = getPostById(id);
  if (!current) return null;

  const updated: PostDetail = {
    ...current,
    title: payload.title,
    excerpt: createExcerpt(payload.content),
    content: payload.content,
    category: payload.category,
    tags: payload.tags,
    majors: normalizeMajorValues(payload.majors),
    question: payload.question,
    bug: payload.bug,
    updatedAt: new Date().toISOString(),
    commentCount: current.comments.length,
  };

  posts = posts.map((post) => (post.id === id ? updated : post));
  return updated;
};

export const deletePost = (id: string) => {
  const target = getPostById(id);
  if (!target) return false;

  posts = posts.filter((post) => post.id !== id);
  return true;
};

export const incrementViewCount = (id: string) => {
  let next: PostDetail | undefined;

  posts = posts.map((post) => {
    if (post.id !== id) return post;

    next = { ...post, viewCount: post.viewCount + 1 };
    return next;
  });

  return next ?? null;
};

export const createComment = (postId: string, payload: CommentPayload) => {
  const createdAt = new Date().toISOString();

  return replacePost(postId, (post) => {
    const comment: PostComment = {
      id: `c-${postId}-${Date.now()}`,
      author: { ...viewerAuthor },
      body: payload.body,
      createdAt,
      updatedAt: createdAt,
      likeCount: 0,
    };

    return syncCommentMeta(post, [...post.comments, comment]);
  });
};

export const updateComment = (postId: string, commentId: string, payload: CommentPayload) => {
  return replacePost(postId, (post) => {
    if (!post.comments.some((comment) => comment.id === commentId)) return null;

    const updatedAt = new Date().toISOString();
    const comments = post.comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            body: payload.body,
            updatedAt,
          }
        : comment
    );

    return syncCommentMeta(post, comments);
  });
};

export const deleteComment = (postId: string, commentId: string) => {
  return replacePost(postId, (post) => {
    if (!post.comments.some((comment) => comment.id === commentId)) return null;

    const comments = post.comments.filter((comment) => comment.id !== commentId);
    return syncCommentMeta(post, comments);
  });
};

export const setAcceptedComment = (postId: string, commentId: string, accepted: boolean) => {
  return replacePost(postId, (post) => {
    if (post.category !== "qna" && post.category !== "bug") return null;
    if (post.category === "qna" && !post.question) return null;
    if (post.category === "bug" && !post.bug) return null;
    if (!post.comments.some((comment) => comment.id === commentId)) return null;

    const acceptedCommentId =
      accepted
        ? commentId
        : post.category === "qna"
          ? post.question?.acceptedCommentId === commentId
            ? null
            : post.question?.acceptedCommentId ?? null
          : post.bug?.acceptedCommentId === commentId
            ? null
            : post.bug?.acceptedCommentId ?? null;

    const comments = post.comments.map((comment) => ({
      ...comment,
      isAccepted: comment.id === acceptedCommentId,
    }));

    return syncCommentMeta(post, comments);
  });
};
