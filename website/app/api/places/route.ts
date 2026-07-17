import { NextResponse } from "next/server";
import { getUser } from "@lib/dal";
import { autocompleteAddress, addressDetails } from "@services/places/lookup";

export const runtime = "nodejs";

/**
 * Address lookup, proxied through our own API.
 *
 * Google's Places JS SDK would need the key in the browser; keeping it here
 * means the key stays server-only (consistent with the rest of the app) and can
 * be locked to this server rather than an HTTP referrer. Auth-gated so it isn't
 * a free Places endpoint for anyone who finds it.
 */
export const POST = async (request: Request) => {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { q?: string; placeId?: string };

  if (body.placeId) {
    const address = await addressDetails(body.placeId);
    return NextResponse.json({ address });
  }

  const q = body.q?.trim();
  if (!q || q.length < 3) return NextResponse.json({ suggestions: [] });

  const suggestions = await autocompleteAddress(q);
  return NextResponse.json({ suggestions });
};
