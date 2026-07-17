import { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { deleteCustomer } from "./actions";
import { AddCustomerButton } from "@components/customers/add-customer-button";
import {
  Button,
  Card,
  PageHeader,
  EmptyState,
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
import { Customer } from "@typings/customer/Customer";

export const metadata: Metadata = { title: "Customers" };

const ACCESSORS: Accessors<Customer> = {
  name: (c) => c.name?.toLowerCase() ?? "",
  email: (c) => c.email?.toLowerCase() ?? null,
  phone: (c) => c.phone ?? null,
  address: (c) => c.address?.toLowerCase() ?? null,
};
const SORT_KEYS = Object.keys(ACCESSORS);

const CustomersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; page?: string }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;

  /* A directory reads best alphabetically, so name/asc is the default here
     rather than the newest-first used by the document tables. */
  const sort = parseSort(params.sort, SORT_KEYS, "name");
  const dir = parseDir(params.dir, "asc");
  const page = parsePage(params.page);

  const supabase = await createClient();
  const all = await listCustomers(supabase);

  const sorted = sortRows(all, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  const current = { sort, dir };
  const sortHref = (key: string) =>
    mergeQuery("/customers", current, {
      sort: key,
      dir: nextDir(key, sort, dir),
      page: undefined,
    });
  const pageHref = (p: number) =>
    mergeQuery("/customers", current, { page: p === 1 ? undefined : String(p) });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="People and businesses you invoice."
        action={<AddCustomerButton />}
      />

      {all.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start invoicing."
          action={<AddCustomerButton />}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-end gap-3 border-b border-border pb-4">
            <Pagination
              {...result}
              hrefFor={pageHref}
              noun="customer"
              variant="bar"
            />
          </div>

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
                  <TableHead className="w-[52px]" />
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
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.phone || "—"}
                    </TableCell>
                    {/* max-w-0 + truncate keeps a long address from stretching
                        the table past the card. */}
                    <TableCell className="hidden max-w-0 truncate text-muted-foreground lg:table-cell">
                      {c.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
};

export default CustomersPage;
