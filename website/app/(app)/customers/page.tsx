import { Metadata } from "next";
import { Trash2, MapPin } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers, getBillingSummaries } from "@services/supabase/customer";
import { deleteCustomer } from "./actions";
import { AddCustomerButton } from "@components/customers/add-customer-button";
import { EditCustomerButton } from "@components/customers/edit-customer-button";
import {
  Button,
  Card,
  PageHeader,
  EmptyState,
  SearchInput,
  ClearFilters,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableHead,
  Pagination,
} from "@components/ui";
import {
  parseSort,
  parseDir,
  parsePage,
  sortRows,
  paginate,
  mergeQuery,
  nextDir,
  Accessors,
} from "@utils/table";
import { formatMoney } from "@utils/money";
import {
  customerAddressLine,
  customerMapsUrl as mapsUrl,
} from "@utils/customer-address";
import { CustomerRow } from "@interfaces/models/customer/CustomerRow";

export const metadata: Metadata = { title: "Customers" };

const ACCESSORS: Accessors<CustomerRow> = {
  name: (c) => c.name?.toLowerCase() ?? "",
  email: (c) => c.email?.toLowerCase() ?? null,
  phone: (c) => c.phone ?? null,
  address: (c) => customerAddressLine(c).toLowerCase() || null,
  invoices: (c) => c.invoice_count,
  billed: (c) => c.total_billed,
};
const SORT_KEYS = Object.keys(ACCESSORS);

const CustomersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    dir?: string;
    page?: string;
    q?: string;
  }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;

  /* A directory reads best alphabetically, so name/asc is the default here
     rather than the newest-first used by the document tables. */
  const sort = parseSort(params.sort, SORT_KEYS, "name");
  const dir = parseDir(params.dir, "asc");
  const page = parsePage(params.page);
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();
  /* Search runs in Postgres; the totals come from a view that aggregates the
     invoices there too, rather than pulling 548 rows in to count them. */
  const [customers, summaries] = await Promise.all([
    listCustomers(supabase, q),
    getBillingSummaries(supabase),
  ]);

  const all: CustomerRow[] = customers.map((c) => {
    const s = summaries.get(c.id);
    return {
      ...c,
      invoice_count: Number(s?.invoice_count ?? 0),
      total_billed: Number(s?.total_billed ?? 0),
      total_paid: Number(s?.total_paid ?? 0),
    };
  });

  const sorted = sortRows(all, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  const current = { sort, dir, q: q || undefined };
  const sortHref = (key: string) =>
    mergeQuery("/customers", current, {
      sort: key,
      dir: nextDir(key, sort, dir),
      page: undefined,
    });
  const pageHref = (p: number) =>
    mergeQuery("/customers", current, { page: p === 1 ? undefined : String(p) });

  const billedTotal = all.reduce((s, c) => s + c.total_billed, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="People and businesses you invoice."
        action={<AddCustomerButton />}
      />

      {/* An empty *search* isn't an empty customer list — keep the box up so
          the search can be cleared. */}
      {all.length === 0 && !q ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start invoicing."
          action={<AddCustomerButton />}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <SearchInput
                placeholder="Search name, email, phone, city…"
                className="w-full sm:max-w-xs"
              />
              <ClearFilters href="/customers" active={Boolean(q)} />
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {formatMoney(billedTotal)} billed
              </span>
              <Pagination
                {...result}
                hrefFor={pageHref}
                noun="customer"
                variant="bar"
              />
            </div>
          </div>

          {all.length === 0 ? (
            <EmptyState
              title="No matches"
              description={`No customer matches “${q}”.`}
            />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      label="Name"
                      sortKey="name"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("name")}
                    />
                    <SortableHead
                      label="Email"
                      sortKey="email"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("email")}
                    />
                    <SortableHead
                      label="Phone"
                      sortKey="phone"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("phone")}
                      className="hidden md:table-cell"
                    />
                    <SortableHead
                      label="Address"
                      sortKey="address"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("address")}
                      className="hidden lg:table-cell"
                    />
                    <SortableHead
                      label="Invoices"
                      sortKey="invoices"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("invoices")}
                      className="text-right"
                    />
                    <SortableHead
                      label="Billed"
                      sortKey="billed"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("billed")}
                      className="text-right"
                    />
                    <TableHead className="w-[96px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.email || "—"}
                        {c.secondary_emails.length > 0 && (
                          <span className="ml-1.5 text-xs text-muted-foreground/70">
                            +{c.secondary_emails.length}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {c.phone || "—"}
                      </TableCell>
                      {/* max-w-0 + truncate keeps a long address from stretching
                          the table past the card. */}
                      <TableCell className="hidden max-w-0 truncate text-muted-foreground lg:table-cell">
                        {mapsUrl(c) ? (
                          <a
                            href={mapsUrl(c)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in Google Maps"
                            className="group inline-flex max-w-full items-center gap-1.5 rounded-full outline-none transition-colors hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <span className="truncate">
                              {customerAddressLine(c)}
                            </span>
                            <MapPin className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {c.invoice_count || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {c.total_billed ? formatMoney(c.total_billed) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <EditCustomerButton customer={c} />
                          <form action={deleteCustomer}>
                            <input type="hidden" name="id" value={c.id} />
                            <Button
                              type="submit"
                              variant="dangerGhost"
                              size="icon"
                              title="Delete customer"
                              aria-label={`Delete ${c.name}`}
                            >
                              <Trash2 />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default CustomersPage;
