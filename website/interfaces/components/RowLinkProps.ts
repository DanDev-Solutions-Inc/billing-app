import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

export interface RowLinkProps extends ComponentProps<typeof Link> {
  children: ReactNode;
}
