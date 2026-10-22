import { refresh } from "@/lib/refresh";
import { RateLimitError } from "@/lib/reddit";

export async function POST() {
  try {
    const result = await refresh();
    return Response.json(result, { status: result.ok ? 200 : 429 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return Response.json({ ok: false, cooldownSec: err.retryInSec }, { status: 429 });
    }
    console.error("[refresh]", err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
