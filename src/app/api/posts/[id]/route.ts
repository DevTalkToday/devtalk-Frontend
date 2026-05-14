import { NextResponse } from "next/server";
import { normalizePostPayload } from "@/lib/posts/normalize";
import { deletePost, getPostById, incrementViewCount, updatePost } from "../store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const shouldTrack = new URL(_req.url).searchParams.get("track") !== "false";
  const post = shouldTrack ? incrementViewCount(id) : getPostById(id);

  if (!post) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const current = getPostById(id);

  if (!current) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });

  try {
    const body = await req.json().catch(() => null);
    const payload = normalizePostPayload(body, current);
    const post = updatePost(id, payload);
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "TITLE_AND_CONTENT_REQUIRED" ? 422 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const removed = deletePost(id);

  if (!removed) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ success: true });
}
