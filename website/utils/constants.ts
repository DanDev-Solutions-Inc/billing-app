// Fixed seller details for DanDev Solutions Inc. — shown on invoices/estimates.
// (Matches the existing Wave invoice template.)
export const BUSINESS = {
  name: "DanDev Solutions Inc.",
  addressLines: ["1458 Flaminia Court", "Mississauga, Ontario L5J 3Z6", "Canada"],
  phoneLabel: "Mobile",
  phone: "416 399 8601",
  website: "www.dandev.solutions",
  // Where clients should write with questions. Documents are sent from a
  // no-reply address, so this is the only route back to a monitored mailbox.
  contactEmail: "karpienia@dandev.solutions",
  taxLabel: "HST",
  taxRate: 13, // percent — default applied to new documents
  taxNumber: "733803910 RT0001",
  // Fiscal year ends August 31 — reports bucket by this, not the calendar.
  fiscalYearEndMonth: 8,
  // Ontario CCPC small business rate: 9% federal + 3.2% provincial, on active
  // business income under the $500k small business limit. The reports page
  // applies this to net income; it is an estimate, not a filed return.
  corpTaxRate: 12.2, // percent
  currency: "CAD",
  defaultTerms:
    "Payment by cheque (payable to DanDev Solutions Inc.) or Interac e-Transfer to karpienia@dandev.solutions.",
  footerNote: "Thank you for your business!",
  // How clients can pay. Shown on invoice emails (and available to the PDF).
  payment: {
    chequePayableTo: "DanDev Solutions Inc.",
    etransferEmail: "karpienia@dandev.solutions",
  },
  // BMO business account — transit/account transcribed from the void cheque.
  // These appear on client-facing invoices; verify against the cheque.
  bank: {
    name: "BMO Bank of Montreal",
    address: "3643 Cawthra Road, Mississauga, ON L5A 2Y4",
    institution: "001", // BMO
    transit: "28022",
    account: "1994897",
    swift: "BOFMCAM2", // for international wires
  },
} as const;

/** Full tax row label, e.g. "HST 13% (733803910 RT0001)". */
export const taxRowLabel = (ratePercent: number): string => {
  const rate = Number.isFinite(ratePercent) ? ratePercent : BUSINESS.taxRate;
  return `${BUSINESS.taxLabel} ${rate}% (${BUSINESS.taxNumber})`;
};

// Expense categories used by receipts, the AI classifier, and transactions.
export const RECEIPT_CATEGORIES = [
  "Software & Subscriptions",
  "Hardware & Equipment",
  "Office Supplies",
  "Travel",
  "Meals & Entertainment",
  "Contractors",
  "Advertising & Promotion",
  "Professional Fees",
  "Utilities",
  "Vehicle & Fuel",
  "Bank & Merchant Fees",
  "Other",
] as const;

// Categories for the manual transaction ledger (income + expense).
export const TRANSACTION_CATEGORIES = [
  "Sales",
  "Consulting",
  "Other Income",
  ...RECEIPT_CATEGORIES,
] as const;

// Wave API endpoints + OAuth scopes for importing invoices/customers.
export const WAVE = {
  authorizeUrl: "https://api.waveapps.com/oauth2/authorize/",
  tokenUrl: "https://api.waveapps.com/oauth2/token/",
  graphqlUrl: "https://gql.waveapps.com/graphql/public",
  scopes: [
    "user:read",
    "business:read",
    "customer:read",
    "invoice:read",
    "estimate:read",
  ],
} as const;
