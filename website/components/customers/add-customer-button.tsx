"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button, Modal } from "@components/ui";
import { CustomerForm } from "@components/customer-form";

/** Opens the customer form in a modal, so the list owns the full page width. */
export const AddCustomerButton = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onSuccess = () => {
    setOpen(false);
    // The list is server-rendered; refresh so the new row appears immediately.
    router.refresh();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus />
        Add customer
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a customer"
        description="Someone you invoice. Only a name is required."
      >
        <CustomerForm onSuccess={onSuccess} />
      </Modal>
    </>
  );
};
