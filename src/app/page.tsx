"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FetchGet } from "@/lib/api/fetch";

type PostListItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: { id: string; nickname: string; avatarUrl: string | null };
  createdAt: string;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  tags: string[];
};

export default function PostsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: () => FetchGet("/api/posts"),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error</div>;

  const items = (data as any)?.items as PostListItem[];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Posts</h1>

      <div className="mt-4 flex flex-col gap-3">
        {items?.map((p) => (
          <Link key={p.id} href={`/${p.id}`} className="rounded-xl border p-4 hover:bg-gray-50">
            <div className="text-sm text-gray-500">{p.category.toUpperCase()}</div>
            <div className="mt-1 text-lg font-semibold">{p.title}</div>
            <div className="mt-1 text-gray-700">{p.excerpt}</div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>{p.author.nickname}</span>
              <span>댓글 {p.commentCount}</span>
              <span>좋아요 {p.likeCount}</span>
              <span>조회 {p.viewCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
