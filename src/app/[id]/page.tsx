"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FetchGet } from "@/lib/api/fetch";

type PostDetail = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: { id: string; nickname: string; avatarUrl: string | null };
  createdAt: string;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  tags: string[];
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: () => FetchGet(`/api/posts/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error</div>;

  const post = data as PostDetail;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="text-sm text-gray-500">{post.category.toUpperCase()}</div>
      <h1 className="mt-1 text-2xl font-semibold">{post.title}</h1>

      <div className="mt-3 text-sm text-gray-500">
        <span>{post.author.nickname}</span>
        <span className="mx-2">·</span>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <div className="mt-6 whitespace-pre-wrap leading-7 text-gray-900">{post.content}</div>

      <div className="mt-6 flex gap-4 text-sm text-gray-500">
        <span>댓글 {post.commentCount}</span>
        <span>좋아요 {post.likeCount}</span>
        <span>조회 {post.viewCount}</span>
      </div>
    </div>
  );
}
