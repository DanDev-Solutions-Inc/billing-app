import { formatMoney } from "@utils/money";
import { CadTotal } from "@utils/fx";

/**
 * "Includes $8,517.34 USD" under a CAD total.
 *
 * A converted figure hides what it's made of, so the foreign part is stated
 * rather than silently folded in. Renders nothing when it's all CAD.
 */
export const CurrencyNote = ({ total }: { total: CadTotal }) => {
  const parts = Object.entries(total.foreign).filter(([, v]) => v);
  if (parts.length === 0) return null;

  return (
    <span className="text-xs text-muted-foreground">
      incl.{" "}
      {parts
        .map(([code, value]) =>
          formatMoney(value, code as "CAD" | "USD"),
        )
        .join(" + ")}
    </span>
  );
};
