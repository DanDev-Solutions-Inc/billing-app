// Fixed seller details for DanDev Solutions Inc. — shown on invoices/estimates.
// (Matches the existing Wave invoice template.)
export const BUSINESS = {
  name: "DanDev Solutions Inc.",
  addressLines: ["1458 Flaminia Court", "Mississauga, Ontario L5J 3Z6", "Canada"],
  phoneLabel: "Mobile",
  phone: "416 399 8601",
  website: "www.dandev.solutions",
  taxLabel: "HST",
  taxRate: 13, // percent — default applied to new documents
  taxNumber: "733803910 RT0001",
  currency: "CAD",
  defaultTerms: "Please make check payable to DanDev Solutions Inc.",
  footerNote: "Thank you for your business!",
} as const;

/** Full tax row label, e.g. "HST 13% (733803910 RT0001)". */
export const taxRowLabel = (ratePercent: number): string => {
  const rate = Number.isFinite(ratePercent) ? ratePercent : BUSINESS.taxRate;
  return `${BUSINESS.taxLabel} ${rate}% (${BUSINESS.taxNumber})`;
};

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
