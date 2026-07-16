import { WaveMoney } from "@interfaces/models/wave/WaveMoney";

export interface WaveEstimateItem {
  description: string | null;
  quantity: string;
  unitPrice: string;
  total: WaveMoney;
}
