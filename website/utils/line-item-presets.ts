/**
 * Default line items you can auto-select instead of retyping the same wording
 * on every invoice.
 *
 * NOTE: `line_items` only has a single `description` column — there is no
 * `title` column — so a preset's title and description are joined into that
 * one field. Splitting them into separate stored fields needs a migration
 * (plus PDF + detail-view changes); see LINE_ITEM_PRESET_TEXT.
 */
export interface LineItemPreset {
  id: string;
  title: string;
  description: string;
}

export const LINE_ITEM_PRESETS: LineItemPreset[] = [
  {
    id: "consulting",
    title: "Consulting services",
    description:
      "Advisory, architecture review, and technical strategy sessions.",
  },
  {
    id: "development",
    title: "Development services",
    description:
      "Software design, implementation, testing, and code review.",
  },
];

/** The text written into a line item's single `description` column. */
export const presetText = (p: LineItemPreset) => `${p.title} — ${p.description}`;
