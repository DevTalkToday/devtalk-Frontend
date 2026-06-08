import Link from "next/link";
import { formatRelativePostDate } from "@/lib/date/relative";
import { BUG_STATUS_LABELS, CATEGORY_LABELS, type PostSummary } from "@/lib/posts/types";
import { BookmarkIcon, CommentIcon, EyeIcon, HeartIcon } from "./icons";

const getStatusLabel = (post: PostSummary) => {
  if (post.category === "qna") return "해결됨";
  if (post.category === "bug") return post.bug ? BUG_STATUS_LABELS[post.bug.status] : "열림";
  return "기록 공유";
};

export function PostCard({ post }: { post: PostSummary }) {
  const authorMeta = post.majors.length ? post.majors.join(", ") : post.author.role;

  return (
    <Link
      href={`/${post.id}`}
      className="grid gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[16px] transition duration-150 hover:-translate-y-[3px] hover:border-(--accent) hover:bg-(--surface-raised)"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            "inline-flex w-fit items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
            post.category === "qna"
              ? "border-(--border) bg-(--accent-soft) text-(--accent)"
              : post.category === "bug"
                ? "border-(--bug-border) bg-(--bug-bg) text-(--bug-text)"
                : "border-(--talk-border) bg-(--talk-bg) text-(--talk-text)",
          ].join(" ")}
        >
          {CATEGORY_LABELS[post.category]}
        </span>
        <span className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold text-(--muted-strong)">
          {getStatusLabel(post)}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{post.title}</h3>
        <p className="line-clamp-2 text-sm leading-6 text-(--muted-strong)">{post.excerpt}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex w-fit items-center justify-center gap-1 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold text-(--muted-strong)"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="grid gap-3 text-sm text-(--muted-strong) md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-1">
          <div className="font-medium text-(--foreground)">
            {post.author.nickname} <span className="text-(--muted)">/ {authorMeta}</span>
          </div>
          <div>{formatRelativePostDate(post.createdAt)}</div>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <CommentIcon className="size-4" />
            {post.commentCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HeartIcon className="size-4" />
            {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookmarkIcon className="size-4" />
            {post.bookmarkCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <EyeIcon className="size-4" />
            {post.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
