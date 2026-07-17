"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@components/ui";
import { CustomerForm } from "@components/customer-form";
import { Customer } from "@typings/customer/Customer";

/**
 * Makes the whole customer row open the edit modal.
 *
 * Customers have no detail route — editing has always been a modal — so this
 * can't use <RowLink>, which needs an href. It mirrors the same trick: a real
 * control whose `::after` covers the row, rather than an onClick on the <tr>.
 *
 * A <button> instead of an <a> on purpose: this opens a dialog, it doesn't
 * navigate, so there's no URL to middle-click or copy.
 */
export const CustomerRowLink = ({ customer }: { customer: Customer }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onSuccess = () => {
    setOpen(false);
    // The list is server-rendered; refresh so the row shows the new values.
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Edit ${customer.name}`}
        className="block w-full truncate text-left font-medium text-foreground outline-none transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-accent focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
      >
        {customer.name}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={`Edit ${customer.name}`}
        description="Update contact details, extra emails, or the address."
      >
        <CustomerForm customer={customer} onSuccess={onSuccess} />
      </Modal>
    </>
  );
};
