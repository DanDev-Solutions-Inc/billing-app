import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { getDocument } from "@services/supabase/document";
import { attachment } from "@utils/content-disposition";

export const runtime = "nodejs";

/**
 * Streams a document's private Blob object to authorized users.
 *
 * Same shape as the receipt file route: the row is read with the caller's
 * session so RLS ("read own or shared") decides who may see it, then the blob
 * is fetched server-side with the store token. The object is never public, so
 * a leaked URL is worth nothing without a session.
 *
 * ?download=1 forces a save dialog; without it a PDF opens inline in the tab,
 * which is what you want when skimming for the right statement.
 */
export const GET = async (
  req: Request,
  ctx: RouteContext<"/api/documents/[id]/file">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const doc = await getDocument(supabase, id);
  if (!doc) return new Response("Not found", { status: 404 });

  const upstream = await fetch(doc.blob_url, {
    headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!upstream.ok || !upstream.body)
    return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type":
      doc.content_type ??
      upstream.headers.get("content-type") ??
      "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  if (new URL(req.url).searchParams.get("download") === "1")
    headers.set("Content-Disposition", attachment(doc.name));

  return new Response(upstream.body, { headers });
};
