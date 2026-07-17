export interface ConfirmButtonProps {
  /** Server action that performs the deletion. Receives `id` in the FormData. */
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  /** Modal heading, e.g. `Delete “Acme Inc.”?` */
  title: string;
  /** What will happen — say it plainly, including anything cascaded. */
  description?: string;
  confirmLabel?: string;
  triggerLabel?: string;
  /**
   * False when the row already sits inside a form (transactions' bulk-select),
   * so this renders a submit button instead of a nested <form>.
   */
  standalone?: boolean;
  className?: string;
}
