import { NextResponse } from "next/server";
import { normalizeCommentAcceptPayload, normalizeCommentPayload } from "@/lib/posts/normalize";
import { deleteComment, getPostById, setAcceptedComment, updateComment } from "../../../store";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const { id, commentId } = await ctx.params;
  const post = getPostById(id);

  if (!post) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  if (!post.comments.some((comment) => comment.id === commentId)) {
    return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => null);
    const current = post.comments.find((comment) => comment.id === commentId);
    const payload = normalizeCommentPayload(body, current);
    const next = updateComment(id, commentId, payload);

    if (!next) return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(next);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "COMMENT_BODY_REQUIRED" ? 422 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id, commentId } = await ctx.params;
  const post = getPostById(id);

  if (!post) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  if ((post.category === "qna" && !post.question) || (post.category === "bug" && !post.bug) || post.category === "talk") {
    return NextResponse.json({ message: "COMMENT_ACCEPT_ONLY_FOR_QNA_OR_BUG" }, { status: 400 });
  }
  if (!post.comments.some((comment) => comment.id === commentId)) {
    return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => null);
    const payload = normalizeCommentAcceptPayload(body);
    const next = setAcceptedComment(id, commentId, payload.accepted);

    if (!next) return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(next);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "COMMENT_ACCEPTED_REQUIRED" ? 422 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id, commentId } = await ctx.params;
  const post = getPostById(id);

  if (!post) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  if (!post.comments.some((comment) => comment.id === commentId)) {
    return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
  }

  const next = deleteComment(id, commentId);

  if (!next) return NextResponse.json({ message: "COMMENT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(next);
}
