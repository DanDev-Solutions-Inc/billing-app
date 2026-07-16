import { WaveMoney } from "@interfaces/models/wave/WaveMoney";
import { WaveEstimateItem } from "@interfaces/models/wave/WaveEstimateItem";

export interface WaveEstimateNode {
  id: string;
  estimateNumber: string | null;
  status: string;
  estimateDate: string | null;
  memo: string | null;
  subtotal: WaveMoney;
  taxTotal: WaveMoney;
  total: WaveMoney;
  customer: { id: string } | null;
  items: WaveEstimateItem[];
}
