import { AddressFormValues } from "@interfaces/forms/AddressFormValues";

export interface AddressFieldsProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
}
