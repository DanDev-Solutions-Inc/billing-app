import "server-only";
import { PlaceSuggestion } from "@interfaces/models/places/PlaceSuggestion";
import { StructuredAddress } from "@interfaces/models/places/StructuredAddress";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

/**
 * Address suggestions from Google Places (New).
 *
 * Returns [] rather than throwing when no key is configured or the call fails —
 * the address fields stay typeable by hand, so a lookup outage is a degraded
 * convenience, never a blocked save.
 */
export const autocompleteAddress = async (
  query: string,
): Promise<PlaceSuggestion[]> => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({
        input: query,
        // Addresses only — no restaurants, no plus-codes.
        includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
        includedRegionCodes: ["ca", "us"],
      }),
    });
    if (!res.ok) {
      console.error(`places: autocomplete ${res.status}`, await res.text());
      return [];
    }

    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId?: string;
          text?: { text?: string };
        };
      }[];
    };

    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text: { text: string } } =>
        Boolean(p?.placeId && p?.text?.text),
      )
      .map((p) => ({ placeId: p.placeId, description: p.text.text }));
  } catch (error) {
    console.error("places: autocomplete failed", error);
    return [];
  }
};

/** Resolve a place id into address parts we can store in columns. */
export const addressDetails = async (
  placeId: string,
): Promise<StructuredAddress | null> => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        // Only the fields we store — field masks are billed per field.
        "X-Goog-FieldMask": "addressComponents",
      },
    });
    if (!res.ok) {
      console.error(`places: details ${res.status}`, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      addressComponents?: {
        longText?: string;
        shortText?: string;
        types?: string[];
      }[];
    };

    const parts = json.addressComponents ?? [];
    const find = (type: string, short = false) => {
      const c = parts.find((p) => p.types?.includes(type));
      return (short ? c?.shortText : c?.longText) ?? null;
    };

    const streetNumber = find("street_number");
    const route = find("route");

    return {
      line1: [streetNumber, route].filter(Boolean).join(" ") || null,
      line2: find("subpremise"),
      // Some municipalities only populate one of these.
      city: find("locality") ?? find("postal_town") ?? find("sublocality"),
      province: find("administrative_area_level_1"),
      postalCode: find("postal_code"),
      country: find("country"),
    };
  } catch (error) {
    console.error("places: details failed", error);
    return null;
  }
};
