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

/**
 * Split a line item into its title and supporting detail for display.
 *
 * There is no `title` column, so the two live in one string. Either separator
 * counts: a newline (how imported/multi-line items are written) or the " — "
 * the presets join with — the description field is a single-line input, so a
 * newline can't be typed there.
 *
 * Only the title should render bold; the detail is supporting text.
 */
export const splitLineItem = (
  text: string,
): { title: string; detail: string } => {
  const [firstLine, ...restLines] = (text ?? "").split("\n");
  if (restLines.length) {
    return { title: firstLine, detail: restLines.join("\n") };
  }
  const at = firstLine.indexOf(" — ");
  if (at === -1) return { title: firstLine, detail: "" };
  return {
    title: firstLine.slice(0, at).trim(),
    detail: firstLine.slice(at + 3).trim(),
  };
};
