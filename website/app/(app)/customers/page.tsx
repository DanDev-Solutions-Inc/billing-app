import { Metadata } from "next";
import { MapPin } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers, getBillingSummaries } from "@services/supabase/customer";
import { deleteCustomer } from "./actions";
import { AddCustomerButton } from "@components/customers/add-customer-button";
import { CustomerRowLink } from "@components/customers/customer-row-link";
import {
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
  Pagination, FilterBar, FilterGroup, ConfirmButton } from "@components/ui";
import { sortRows, paginate, Accessors } from "@utils/table";
import { tableView } from "@utils/table/table-view";
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
  const q = params.q?.trim() ?? "";

  /* A directory reads best alphabetically, so name/asc rather than the
     newest-first the document tables use. */
  const { sort, dir, page, sortHref, pageHref } = tableView({
    basePath: "/customers",
    params,
    sortKeys: SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
    filters: { q: q || undefined },
  });

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
      total_billed_foreign: s?.total_billed_foreign ?? null,
    };
  });

  const sorted = sortRows(all, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

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
          <FilterBar>
            <FilterGroup className="flex-1">
              <SearchInput
                placeholder="Search name, email, phone, city…"
                className="w-full sm:max-w-xs"
              />
              <ClearFilters href="/customers" active={Boolean(q)} />
            </FilterGroup>
            <FilterGroup className="sm:gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {formatMoney(billedTotal)} billed
              </span>
              <Pagination
                {...result}
                hrefFor={pageHref}
                noun="customer"
                variant="bar"
              />
            </FilterGroup>
          </FilterBar>

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
                      className="min-w-[12rem]"
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
                      className="hidden sm:table-cell"
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
                      className="hidden w-full lg:table-cell"
                    />
                    <SortableHead
                      label="Invoices"
                      sortKey="invoices"
                      activeKey={sort}
                      activeDir={dir}
                      href={sortHref("invoices")}
                      className="hidden text-right md:table-cell"
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
                      <TableCell className="min-w-[12rem] max-w-0">
                        {/* Opens the edit modal from anywhere on the row. */}
                        <CustomerRowLink customer={c} />
                        {/* Email and invoice count fold under the name on
                            mobile — as columns they left the name ~80px. */}
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
                          {[
                            c.email,
                            c.invoice_count
                              ? `${c.invoice_count} invoice${c.invoice_count === 1 ? "" : "s"}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No email"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
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
                      <TableCell className="hidden w-full max-w-0 truncate text-muted-foreground lg:table-cell">
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
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                        {c.invoice_count || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {c.total_billed ? formatMoney(c.total_billed) : "—"}
                        {c.total_billed_foreign ? (
                          /* The CAD figure hides that this was billed in USD —
                             say so rather than let it read as CAD invoices. */
                          <span className="block text-xs font-normal text-muted-foreground">
                            {formatMoney(c.total_billed_foreign, c.currency)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {/* No edit icon — the row opens the customer. Delete is
                            muted until hover and asks first: it's irreversible
                            and sits one row away from every other click. */}
                        <div className="relative z-10 flex items-center justify-end gap-1">
                          <ConfirmButton
                            action={deleteCustomer}
                            id={c.id}
                            title={`Delete ${c.name}?`}
                            description="This removes the customer. Their invoices stay, but lose the link."
                            triggerLabel={`Delete ${c.name}`}
                          />
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
