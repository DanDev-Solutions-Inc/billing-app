"use client";

import { useFormik } from "formik";
import { createCustomer } from "@app/(app)/customers/actions";
import { customerSchema } from "@utils/validation/customerSchema";
import { CustomerFormValues } from "@interfaces/forms/CustomerFormValues";
import { Field, inputClass, Button } from "@components/ui";

const initialValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export const CustomerForm = () => {
  const formik = useFormik<CustomerFormValues>({
    initialValues,
    validationSchema: customerSchema,
    onSubmit: async (values, { setStatus, resetForm }) => {
      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("email", values.email);
      formData.set("phone", values.phone);
      formData.set("address", values.address);
      const result = await createCustomer({}, formData);
      if (result?.error) setStatus({ error: result.error });
      else resetForm();
    },
  });

  const status = formik.status as { error?: string } | undefined;

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
      <Field label="Address" htmlFor="address">
        <textarea
          id="address"
          name="address"
          rows={2}
          value={formik.values.address}
          onChange={formik.handleChange}
          className={inputClass}
        />
      </Field>
      {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}
      <div>
        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Adding…" : "Add customer"}
        </Button>
      </div>
    </form>
  );
};
