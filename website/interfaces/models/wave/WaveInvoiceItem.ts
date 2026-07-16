import { WaveMoney } from "@interfaces/models/wave/WaveMoney";

export interface WaveInvoiceItem {
  description: string | null;
  quantity: string;
  price: string;
  total: WaveMoney;
}
