import { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { deleteCustomer } from "./actions";
import { CustomerForm } from "@components/customer-form";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageHeader,
  EmptyState,
} from "@components/ui";

export const metadata: Metadata = { title: "Customers" };

const CustomersPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const customers = await listCustomers(supabase);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="People and businesses you invoice."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add a customer</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm />
          </CardContent>
        </Card>

        <div>
          {customers.length === 0 ? (
            <EmptyState
              title="No customers yet"
              description="Add your first customer using the form on the left."
            />
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {c.address && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {c.address}
                      </p>
                    )}
                  </div>
                  <form action={deleteCustomer}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button
                      type="submit"
                      variant="dangerGhost"
                      size="icon"
                      title="Delete customer"
                      aria-label="Delete customer"
                    >
                      <Trash2 />
                    </Button>
                  </form>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersPage;
