export interface SidebarProps {
  email: string;
  /** Called when a nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
  /**
   * Allow collapsing to icons. Off inside the mobile drawer, which isn't
   * width-constrained and where a mini rail would just be confusing.
   */
  collapsible?: boolean;
}
