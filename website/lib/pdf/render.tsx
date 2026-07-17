import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument, type PdfDocData } from "@lib/pdf/invoice-document";
import { formatMoney, formatDate } from "@utils/money";
import { taxRowLabel } from "@utils/constants";
import { chargesTax } from "@utils/currency";
import { CurrencyCode } from "@typings/CurrencyCode";
import { Customer } from "@typings/customer/Customer";
import { LineItem } from "@typings/line-item/LineItem";

let logoCache: Buffer | null = null;
const loadLogo = (): Buffer | undefined => {
  if (logoCache) return logoCache;
  try {
    logoCache = readFileSync(
      path.join(process.cwd(), "public", "brand", "DavdevSolutionsDark.png"),
    );
    return logoCache;
  } catch {
    return undefined;
  }
};

export interface RenderInput {
  kind: "INVOICE" | "ESTIMATE";
  /** Decides money formatting and whether a tax row appears at all. */
  currency?: CurrencyCode;
  number: string | null;
  issueDate: string | null;
  secondLabel: string;
  secondDate: string | null;
  amountDue: number;
  customer: Customer | null;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
}

export const renderDocumentPdf = async (
  input: RenderInput,
): Promise<Buffer> => {
  const currency = input.currency ?? "CAD";
  const taxRate =
    input.subtotal > 0 ? Math.round((input.tax / input.subtotal) * 100) : 0;
  /* US work carries no tax, so the HST row is dropped entirely — printing
     "HST 0% (733803910 RT0001)" on a US invoice would be plainly wrong. */
  const taxable = chargesTax(currency);

  const data: PdfDocData = {
    kind: input.kind,
    number: input.number || "—",
    issueDate: formatDate(input.issueDate),
    secondLabel: input.secondLabel,
    secondDate: formatDate(input.secondDate),
    amountDueLabel: `Amount Due (${currency})`,
    amountDue: formatMoney(input.amountDue, currency),
    customer: input.customer
      ? {
          name: input.customer.name,
          lines: (input.customer.address ?? "")
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
          phone: input.customer.phone,
          email: input.customer.email,
        }
      : null,
    items: input.items.map((it) => ({
      description: it.description,
      quantity: String(it.quantity),
      rate: formatMoney(it.unit_price, currency),
      amount: formatMoney(it.amount, currency),
    })),
    subtotal: formatMoney(input.subtotal, currency),
    taxLabel: taxable ? taxRowLabel(taxRate) : null,
    tax: taxable ? formatMoney(input.tax, currency) : null,
    total: formatMoney(input.total, currency),
    notes: input.notes,
    logo: loadLogo(),
  };

  return renderToBuffer(<InvoiceDocument data={data} />);
};
