import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";
import { BUSINESS } from "@utils/constants";
import { splitLineItem } from "@utils/line-item-presets";

// Light theme with the DanDev brand gradient accent.
const BG = "#ffffff"; // page background (white)
const PANEL = "#eef2f7"; // subtle raised panel (amount-due highlight)
const INK = "#151515"; // primary text (near-black)
const MUTED = "#64707d"; // labels / secondary text
const LINE = "#e3e7ec"; // dividers / table row borders
const BLUE = "#144783"; // table header bar (on-brand navy)

// A4 width in points — used to full-bleed the top gradient bar.
const PAGE_W = 595.28;

// Print-safe horizontal margin for text content (~0.33"). The gradient
// banner and the full-width borders/bars break out of this with -EDGE.
const EDGE = 24;

export interface PdfDocData {
  kind: "INVOICE" | "ESTIMATE";
  number: string;
  issueDate: string; // formatted
  secondLabel: string; // "Payment Due" | "Expires"
  secondDate: string; // formatted
  amountDueLabel: string; // "Amount Due (CAD)" | "Total (CAD)"
  amountDue: string; // formatted money
  customer: {
    name: string;
    lines: string[]; // address lines
    phone?: string | null;
    email?: string | null;
  } | null;
  items: {
    description: string;
    quantity: string;
    rate: string; // formatted money
    amount: string; // formatted money
  }[];
  subtotal: string;
  taxLabel: string;
  tax: string;
  total: string;
  notes?: string | null;
  logo?: Buffer | string; // png buffer or data uri
}

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingHorizontal: EDGE,
    paddingBottom: 56,
    fontSize: 9.5,
    color: INK,
    backgroundColor: BG,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  topBar: { position: "absolute", top: 0, left: 0 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: { width: 210 },
  docTitle: {
    fontSize: 30,
    fontFamily: "Helvetica",
    color: INK,
    letterSpacing: 1,
  },
  sellerBlock: { marginTop: 8, alignItems: "flex-end" },
  sellerName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  right: { textAlign: "right" },
  muted: { color: MUTED },
  divider: {
    height: 1,
    backgroundColor: LINE,
    marginVertical: 16,
    marginHorizontal: -EDGE, // full-bleed border
  },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  billTo: { width: "50%" },
  metaCol: { width: "45%" },
  label: { color: MUTED, fontSize: 8, letterSpacing: 1 },
  billName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginRight: 10,
  },
  metaValue: { width: 110, textAlign: "right" },
  amountDueRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: BLUE,
    color: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: EDGE, // full-bleed bar, text aligned to the text margin
    marginTop: 26,
    marginHorizontal: -EDGE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: EDGE, // full-bleed border, cells aligned to the text margin
    marginHorizontal: -EDGE,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  cDesc: { width: "52%", paddingRight: 8 },
  cQty: { width: "12%", textAlign: "right" },
  cRate: { width: "18%", textAlign: "right" },
  cAmt: { width: "18%", textAlign: "right" },
  itemTitle: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  totals: { marginTop: 14, alignItems: "flex-end" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "55%",
    paddingVertical: 3,
  },
  totalLabel: { textAlign: "right", marginRight: 12, color: MUTED },
  totalLabelStrong: {
    textAlign: "right",
    marginRight: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  totalValue: { width: 100, textAlign: "right" },
  totalDivider: {
    height: 1,
    backgroundColor: LINE,
    width: "55%",
    marginVertical: 3,
  },
  notes: { marginTop: 34 },
  notesTitle: { fontFamily: "Helvetica-Bold", marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: EDGE,
    right: EDGE,
    textAlign: "center",
    color: MUTED,
    fontSize: 9,
  },
});

export const InvoiceDocument = ({ data }: { data: PdfDocData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Signature blue → red gradient bar, full bleed at the very top */}
        <Svg style={s.topBar} width={PAGE_W} height={4} fixed>
          <Defs>
            <LinearGradient id="topbar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#2f6fd0" />
              <Stop offset="0.5" stopColor="#3b3f63" />
              <Stop offset="1" stopColor="#d0533f" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={PAGE_W} height={4} fill="url(#topbar)" />
        </Svg>

        {/* Header: logo + big title */}
        <View style={s.headerRow}>
          <View>
            {data.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logo} style={s.logo} />
            ) : (
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 18 }}>
                {BUSINESS.name}
              </Text>
            )}
          </View>
          <Text style={s.docTitle}>{data.kind}</Text>
        </View>

        {/* Seller block, right aligned */}
        <View style={s.sellerBlock}>
          <Text style={[s.sellerName, s.right]}>{BUSINESS.name}</Text>
          {BUSINESS.addressLines.map((l) => (
            <Text key={l} style={s.right}>
              {l}
            </Text>
          ))}
          <Text style={[s.right, { marginTop: 8 }]}>
            {BUSINESS.phoneLabel}: {BUSINESS.phone}
          </Text>
          <Text style={s.right}>{BUSINESS.website}</Text>
        </View>

        <View style={s.divider} />

        {/* Bill-to + meta */}
        <View style={s.twoCol}>
          <View style={s.billTo}>
            <Text style={s.label}>BILL TO</Text>
            {data.customer ? (
              <>
                <Text style={s.billName}>{data.customer.name}</Text>
                {data.customer.lines.map((l, i) => (
                  <Text key={i}>{l}</Text>
                ))}
                {data.customer.phone && (
                  <Text style={{ marginTop: 6 }}>{data.customer.phone}</Text>
                )}
                {data.customer.email && <Text>{data.customer.email}</Text>}
              </>
            ) : (
              <Text style={s.muted}>—</Text>
            )}
          </View>

          <View style={s.metaCol}>
            <MetaRow label={`${titleCase(data.kind)} Number:`} value={data.number} />
            <MetaRow label={`${titleCase(data.kind)} Date:`} value={data.issueDate} />
            <MetaRow label={`${data.secondLabel}:`} value={data.secondDate} />
            <View style={s.amountDueRow}>
              <Text style={s.metaLabel}>{data.amountDueLabel}:</Text>
              <Text style={[s.metaValue, { fontFamily: "Helvetica-Bold" }]}>
                {data.amountDue}
              </Text>
            </View>
          </View>
        </View>

        {/* Line items table */}
        <View style={s.tableHead}>
          <Text style={s.cDesc}>Services</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cRate}>Rate</Text>
          <Text style={s.cAmt}>Amount</Text>
        </View>
        {data.items.map((it, i) => {
          /* Only the title is bold — the rest is supporting detail. */
          const { title, detail } = splitLineItem(it.description);
          return (
            <View key={i} style={s.row}>
              <View style={s.cDesc}>
                <Text style={s.itemTitle}>{title}</Text>
                {detail && <Text style={s.muted}>{detail}</Text>}
              </View>
              <Text style={s.cQty}>{it.quantity}</Text>
              <Text style={s.cRate}>{it.rate}</Text>
              <Text style={s.cAmt}>{it.amount}</Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text style={s.totalLabelStrong}>Subtotal:</Text>
            <Text style={s.totalValue}>{data.subtotal}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={s.totalLabel}>{data.taxLabel}:</Text>
            <Text style={s.totalValue}>{data.tax}</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalLine}>
            <Text style={s.totalLabelStrong}>Total:</Text>
            <Text style={s.totalValue}>{data.total}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={s.totalLabelStrong}>{data.amountDueLabel}:</Text>
            <Text style={[s.totalValue, { fontFamily: "Helvetica-Bold" }]}>
              {data.amountDue}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.notes}>
            <Text style={s.notesTitle}>Notes / Terms</Text>
            <Text style={s.muted}>{data.notes}</Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          {BUSINESS.footerNote}
        </Text>
      </Page>
    </Document>
  );
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={s.metaRow}>
    <Text style={s.metaLabel}>{label}</Text>
    <Text style={s.metaValue}>{value}</Text>
  </View>
);

const titleCase = (kind: string) =>
  kind.charAt(0) + kind.slice(1).toLowerCase();
