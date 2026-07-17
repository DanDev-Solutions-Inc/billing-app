import { ToastTone } from "@typings/ui/ToastTone";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}
