"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button, Modal } from "@components/ui";
import { CustomerForm } from "@components/customer-form";
import { Customer } from "@typings/customer/Customer";

/** Edits a customer in a modal, mirroring how they're added. */
export const EditCustomerButton = ({ customer }: { customer: Customer }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onSuccess = () => {
    setOpen(false);
    // The list is server-rendered; refresh so the row shows the new values.
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Edit customer"
        aria-label={`Edit ${customer.name}`}
      >
        <Pencil />
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Edit ${customer.name}`}
        description="Update contact details, extra emails, or the address."
      >
        <CustomerForm customer={customer} onSuccess={onSuccess} />
      </Modal>
    </>
  );
};
