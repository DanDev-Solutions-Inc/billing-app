import { TxnDirection } from "@typings/transaction/TxnDirection";
import { TxnStatus } from "@typings/transaction/TxnStatus";
import { SortDir } from "@utils/table";

export interface TransactionFilters {
  direction?: TxnDirection;
  status?: TxnStatus;
  /** Inclusive lower bound on txn_date (yyyy-mm-dd) — the period window. */
  from?: string;
  /** Free text over description and category. */
  search?: string;
  sort?: string;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
}
