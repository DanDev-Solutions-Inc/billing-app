import { WaveImportSummary } from "@interfaces/models/wave/WaveImportSummary";

export interface WaveSyncState {
  error?: string;
  summary?: WaveImportSummary;
}
