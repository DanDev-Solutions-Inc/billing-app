export interface BackButtonProps {
  /** Where to go when there's no history to pop (direct load, new tab). */
  fallbackHref: string;
  label?: string;
  className?: string;
}
