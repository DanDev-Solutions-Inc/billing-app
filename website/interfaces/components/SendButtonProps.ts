interface SendState {
  error?: string;
  ok?: string;
}

export interface SendButtonProps {
  id: string;
  action: (prev: SendState, formData: FormData) => Promise<SendState>;
  label?: string;
}
