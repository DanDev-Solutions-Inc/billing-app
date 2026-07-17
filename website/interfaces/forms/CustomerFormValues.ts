export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  /** Extra contacts an invoice or schedule can be sent to. */
  secondary_emails: string[];
}
