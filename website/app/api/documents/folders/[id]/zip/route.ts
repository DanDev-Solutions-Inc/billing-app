import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
/* archiver 8 exports classes rather than the old callable default. */
import { ZipArchive } from "archiver";
import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { getFolder, listFolderTree } from "@services/supabase/document";
import { attachment } from "@utils/content-disposition";

export const runtime = "nodejs";
/* Zipping a year of statements is not a 15-second job. */
export const maxDuration = 300;

/**
 * Streams a folder and everything under it as a zip.
 *
 * Streamed rather than buffered: "send my accountant the 2026 folder" is a
 * few hundred megabytes of PDFs, and building that in memory before the first
 * byte goes out would blow the function's memory and time out on the wait.
 * The archive is piped straight to the response, so the download starts
 * immediately and memory stays flat regardless of folder size.
 *
 * store: true — no compression. PDFs, JPEGs and xlsx files are already
 * compressed; deflating them again burns CPU for a percent or two.
 */
export const GET = async (
  _req: Request,
  ctx: RouteContext<"/api/documents/folders/[id]/zip">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  /* Both reads are RLS-scoped, so a folder the caller can't see 404s here
     rather than leaking its contents. */
  const folder = await getFolder(supabase, id);
  if (!folder) return new Response("Not found", { status: 404 });

  const files = await listFolderTree(supabase, id);

  const archive = new ZipArchive({ store: true });
  /* An empty folder still produces a valid (empty) zip rather than an error —
     less surprising than a failed download when you've just made the folder. */

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  /* Fill the archive in the background and stream what it produces. Not
     awaited: the response has to be returned now so the browser starts
     receiving, and archiver applies backpressure while the client drinks. */
  void (async () => {
    try {
      for (const file of files) {
        const upstream = await fetch(file.blob_url, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!upstream.ok || !upstream.body) continue;

        /* Wait for archiver to finish consuming each entry before fetching the
           next. Without this the loop would open every blob connection at once
           — archiver queues the streams, so a folder of 500 files would sit in
           memory waiting its turn, which is exactly what streaming was meant to
           avoid. */
        await new Promise<void>((resolve, reject) => {
          archive.once("entry", () => resolve());
          archive.once("error", reject);
          /* fetch hands back the DOM ReadableStream; fromWeb wants the
             node:stream/web one. Same object at runtime, separate declarations. */
          archive.append(
            Readable.fromWeb(
              upstream.body as unknown as NodeReadableStream<Uint8Array>,
            ),
            { name: file.rel_path },
          );
        });
      }
      await archive.finalize();
    } catch {
      /* Abort rather than finalize: a truncated-but-valid zip would look like a
         complete download that quietly lost files. A broken one is noticed. */
      archive.abort();
    }
  })();

  return new Response(Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": attachment(`${folder.name}.zip`),
      "Cache-Control": "no-store",
    },
  });
};
