"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Field, inputClass } from "@components/ui";
import { PlaceSuggestion } from "@interfaces/models/places/PlaceSuggestion";
import { StructuredAddress } from "@interfaces/models/places/StructuredAddress";
import { AddressFieldsProps } from "@interfaces/components/AddressFieldsProps";

/**
 * Address entry: search once, or type the parts by hand.
 *
 * Lookup goes through our own /api/places so the Google key stays server-side.
 * Every field stays editable — a picked address is a starting point, and the
 * fields work fine if lookup is unconfigured or down.
 */
export const AddressFields = ({ values, onChange }: AddressFieldsProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Clearing belongs with the keystroke that caused it — doing it in the effect
  // is a synchronous setState that can cascade renders.
  const onQueryChange = (next: string) => {
    setQuery(next);
    if (next.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
    }
  };

  // Debounced — Places bills per request.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/places", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q }),
        });
        const { suggestions } = (await res.json()) as {
          suggestions: PlaceSuggestion[];
        };
        setSuggestions(suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const pick = async (s: PlaceSuggestion) => {
    setOpen(false);
    setQuery("");
    setBusy(true);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ placeId: s.placeId }),
      });
      const { address } = (await res.json()) as {
        address: StructuredAddress | null;
      };
      if (address) {
        onChange({
          address_line1: address.line1 ?? "",
          address_line2: address.line2 ?? "",
          city: address.city ?? "",
          province: address.province ?? "",
          postal_code: address.postalCode ?? "",
          country: address.country ?? "",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const set = (field: keyof typeof values) => (v: string) =>
    onChange({ ...values, [field]: v });

  return (
    <div className="flex flex-col gap-4">
      {/* Search — optional shortcut that fills the fields below */}
      <div ref={rootRef} className="relative">
        <Field label="Find address" htmlFor="address_search">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="address_search"
              type="text"
              autoComplete="off"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder="Start typing an address…"
              className={`${inputClass} pl-9`}
            />
            {busy && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </Field>

        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-glass-border bg-navy-700 py-1 shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => pick(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-white/[0.06]"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span>{s.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address" htmlFor="address_line1">
          <input
            id="address_line1"
            name="address_line1"
            value={values.address_line1}
            onChange={(e) => set("address_line1")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Unit / suite" htmlFor="address_line2">
          <input
            id="address_line2"
            name="address_line2"
            value={values.address_line2}
            onChange={(e) => set("address_line2")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            value={values.city}
            onChange={(e) => set("city")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Province / state" htmlFor="province">
          <input
            id="province"
            name="province"
            value={values.province}
            onChange={(e) => set("province")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Postal code" htmlFor="postal_code">
          <input
            id="postal_code"
            name="postal_code"
            value={values.postal_code}
            onChange={(e) => set("postal_code")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Country" htmlFor="country">
          <input
            id="country"
            name="country"
            value={values.country}
            onChange={(e) => set("country")(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
};
