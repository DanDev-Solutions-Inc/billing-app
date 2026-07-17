"use client";

import { useFormik } from "formik";
import { Plus, X } from "lucide-react";
import { createCustomer, updateCustomerAction } from "@app/(app)/customers/actions";
import { customerSchema } from "@utils/validation/customerSchema";
import { CustomerFormValues } from "@interfaces/forms/CustomerFormValues";
import { CustomerFormProps } from "@interfaces/components/CustomerFormProps";
import { AddressFormValues } from "@interfaces/components/AddressFieldsProps";
import { AddressFields } from "@components/customers/address-fields";
import { Field, inputClass, Button, Alert } from "@components/ui";

const blank: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "",
  secondary_emails: [],
};

/**
 * Create or edit a customer. `customer` switches it to edit mode; `onSuccess`
 * lets a host (e.g. a modal) react once the save lands.
 */
export const CustomerForm = ({ customer, onSuccess }: CustomerFormProps = {}) => {
  const isEdit = Boolean(customer);

  const formik = useFormik<CustomerFormValues>({
    initialValues: customer
      ? {
          name: customer.name ?? "",
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          address_line1: customer.address_line1 ?? "",
          address_line2: customer.address_line2 ?? "",
          city: customer.city ?? "",
          province: customer.province ?? "",
          postal_code: customer.postal_code ?? "",
          country: customer.country ?? "",
          secondary_emails: customer.secondary_emails ?? [],
        }
      : blank,
    enableReinitialize: true,
    validationSchema: customerSchema,
    onSubmit: async (values, { setStatus, resetForm }) => {
      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("email", values.email);
      formData.set("phone", values.phone);
      formData.set("address_line1", values.address_line1);
      formData.set("address_line2", values.address_line2);
      formData.set("city", values.city);
      formData.set("province", values.province);
      formData.set("postal_code", values.postal_code);
      formData.set("country", values.country);
      values.secondary_emails
        .filter((e) => e.trim())
        .forEach((e) => formData.append("secondary_email", e));

      const result = customer
        ? await updateCustomerAction(customer.id, {}, formData)
        : await createCustomer({}, formData);
      if (result?.error) {
        setStatus({ error: result.error });
        return;
      }
      if (!isEdit) resetForm();
      onSuccess?.();
    },
  });

  const status = formik.status as { error?: string } | undefined;

  const address: AddressFormValues = {
    address_line1: formik.values.address_line1,
    address_line2: formik.values.address_line2,
    city: formik.values.city,
    province: formik.values.province,
    postal_code: formik.values.postal_code,
    country: formik.values.country,
  };

  const onAddressChange = (next: AddressFormValues) =>
    formik.setValues({ ...formik.values, ...next });

  const setSecondary = (i: number, v: string) =>
    formik.setFieldValue(
      "secondary_emails",
      formik.values.secondary_emails.map((e, idx) => (idx === i ? v : e)),
    );

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Name" htmlFor="name">
        <input
          id="name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="text-xs text-brand-red">{formik.errors.name}</p>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-xs text-brand-red">{formik.errors.email}</p>
          )}
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Extra contacts — an invoice or schedule can be sent to any of these. */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Additional emails
        </span>
        {formik.values.secondary_emails.map((email, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={email}
              onChange={(e) => setSecondary(i, e.target.value)}
              type="email"
              placeholder="ap@example.com"
              aria-label={`Additional email ${i + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                formik.setFieldValue(
                  "secondary_emails",
                  formik.values.secondary_emails.filter((_, idx) => idx !== i),
                )
              }
              aria-label="Remove email"
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-brand-red/10 hover:text-brand-red"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            formik.setFieldValue("secondary_emails", [
              ...formik.values.secondary_emails,
              "",
            ])
          }
          className="flex w-fit items-center gap-1 text-sm font-medium text-brand-accent hover:underline"
        >
          <Plus className="size-4" />
          Add email
        </button>
      </div>

      <AddressFields values={address} onChange={onAddressChange} />

      {status?.error && <Alert tone="error">{status.error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Add customer"}
        </Button>
      </div>
    </form>
  );
};
