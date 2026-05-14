import { NextResponse } from "next/server";
import { normalizeCommentPayload } from "@/lib/posts/normalize";
import { createComment, getPostById } from "../../store";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const post = getPostById(id);

  if (!post) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });

  try {
    const body = await req.json().catch(() => null);
    const payload = normalizeCommentPayload(body);
    const next = createComment(id, payload);

    if (!next) return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json(next, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "COMMENT_BODY_REQUIRED" ? 422 : 400;
    return NextResponse.json({ message }, { status });
  }
}
