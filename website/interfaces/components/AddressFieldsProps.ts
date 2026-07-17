export interface AddressFormValues {
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface AddressFieldsProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
}
