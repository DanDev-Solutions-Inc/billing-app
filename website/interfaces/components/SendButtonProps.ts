interface SendState {
  error?: string;
  ok?: string;
}

export interface SendButtonProps {
  id: string;
  action: (prev: SendState, formData: FormData) => Promise<SendState>;
  label?: string;
  /**
   * The customer's addresses, primary first. With more than one, the button
   * asks which to use; with one it just sends. Either way the server re-checks
   * the choice against the customer record.
   */
  emails?: string[];
}
