import { TaxBreakdownProps } from "@interfaces/components/TaxBreakdownProps";
import { BUSINESS } from "@utils/constants";
import { formatMoney, splitTaxInclusive } from "@utils/money";

/**
 * Subtotal / HST / Total for a single stored amount.
 *
 * Deliberately *not* using taxRowLabel(): that stamps our own HST registration
 * number on the row, which is right for invoices we issue and wrong here — the
 * tax on a receipt was charged by the vendor under their number, not ours.
 */
export const TaxBreakdown = ({
  amount,
  taxIncluded,
  showTotal = true,
}: TaxBreakdownProps) => {
  const { subtotal, tax, total } = splitTaxInclusive(
    amount,
    taxIncluded ? BUSINESS.taxRate : 0,
  );

  if (!taxIncluded && !showTotal) {
    return (
      <p className="text-xs text-muted-foreground">
        No {BUSINESS.taxLabel} — exempt or zero-rated
      </p>
    );
  }

  return (
    <dl className="space-y-1.5 text-sm">
      {taxIncluded ? (
        <>
          <Row label="Subtotal" value={subtotal} />
          <Row
            label={`${BUSINESS.taxLabel} (${BUSINESS.taxRate}%)`}
            value={tax}
          />
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          No {BUSINESS.taxLabel} — exempt or zero-rated
        </p>
      )}
      {showTotal && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5 font-medium text-foreground">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(total)}</dd>
        </div>
      )}
    </dl>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-muted-foreground">
    <dt>{label}</dt>
    <dd className="tabular-nums">{formatMoney(value)}</dd>
  </div>
);
