import { WaveAddress } from "@interfaces/models/wave/WaveAddress";

export interface WaveCustomerNode {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  address: WaveAddress | null;
}
