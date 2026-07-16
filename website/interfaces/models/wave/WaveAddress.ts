export interface WaveAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  province: { name: string } | null;
  country: { name: string } | null;
}
