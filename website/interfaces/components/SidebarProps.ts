export interface SidebarProps {
  email: string;
  /** Called when a nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
}
