import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { getReceipt } from "@services/supabase/receipt";

export const runtime = "nodejs";

// Streams a receipt's private Blob file to authorized users only. The receipt is
// fetched with the user's session (RLS scopes it to owner/shared), then the
// private blob is read server-side with the store token — it is never public.
export const GET = async (
  _req: Request,
  ctx: RouteContext<"/api/receipts/[id]/file">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const receipt = await getReceipt(supabase, id);
  if (!receipt?.image_url) return new Response("Not found", { status: 404 });

  const upstream = await fetch(receipt.image_url, {
    headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!upstream.ok || !upstream.body)
    return new Response("Not found", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
};
