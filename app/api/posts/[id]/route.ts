import type { NextRequest } from "next/server";
import { updateData } from "@/lib/store";
import type { PostStatus } from "@/lib/types";

const STATUSES: PostStatus[] = ["open", "answered", "skipped"];

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: PostStatus } | null;
  const status = body?.status;
  if (!status || !STATUSES.includes(status)) {
    return Response.json({ error: "status must be open | answered | skipped" }, { status: 400 });
  }

  const found = await updateData((data) => {
    const post = data.posts[id];
    if (!post) return false;
    post.status = status;
    post.statusAt = status === "open" ? null : Date.now();
    return true;
  });

  return found ? Response.json({ ok: true }) : Response.json({ error: "not found" }, { status: 404 });
}
