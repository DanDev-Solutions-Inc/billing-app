"use client";

import { useFormik } from "formik";
import { LineItemsEditor } from "@components/invoices/line-items-editor";
import { Card, Field, inputClass, Button, Select } from "@components/ui";
import { Combobox } from "@components/ui/combobox";
import { recurringSchema } from "@utils/validation/recurringSchema";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { RecurringFormValues } from "@interfaces/forms/RecurringFormValues";
import { RecurringInvoiceFormProps } from "@interfaces/components/RecurringInvoiceFormProps";

const today = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

const blankItem = (): LineItemFormValues => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

export const RecurringInvoiceForm = ({
  customers,
  action,
}: RecurringInvoiceFormProps) => {
  const formik = useFormik<RecurringFormValues>({
    initialValues: {
      customer_id: "",
      title: "",
      frequency: "monthly",
      interval: 1,
      next_run: today(),
      net_days: 14,
      auto_send: true,
      send_to: "",
      end_date: "",
      notes: "",
      tax_rate: 13,
      items: [blankItem()],
    },
    validationSchema: recurringSchema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      values.items.forEach((it) => {
        formData.append("item_description", it.description);
        formData.append("item_quantity", String(it.quantity));
        formData.append("item_unit_price", String(it.unit_price));
      });
      formData.set("customer_id", values.customer_id);
      formData.set("title", values.title);
      formData.set("frequency", values.frequency);
      formData.set("interval", String(values.interval));
      formData.set("next_run", values.next_run);
      formData.set("net_days", String(values.net_days));
      formData.set("tax_rate", String(values.tax_rate));
      formData.set("notes", values.notes);
      formData.set("end_date", values.end_date);
      if (values.auto_send) formData.set("auto_send", "on");
      formData.set("send_to", values.send_to);
      const result = await action({}, formData);
      if (result?.error) setStatus({ error: result.error });
    },
  });

  const status = formik.status as { error?: string } | undefined;

  /* Every address on file for the chosen customer. "" = follow the primary, so
     the schedule tracks the customer if that address later changes. */
  const selectedCustomer = customers.find(
    (c) => c.id === formik.values.customer_id,
  );
  const emailOptions = selectedCustomer
    ? [
        ...(selectedCustomer.email
          ? [{ value: "", label: `${selectedCustomer.email} (primary)` }]
          : []),
        ...(selectedCustomer.secondary_emails ?? []).map((e) => ({
          value: e,
          label: e,
        })),
      ]
    : [];

  const onItemChange = (
    index: number,
    field: keyof LineItemFormValues,
    value: string,
  ) => {
    const items = formik.values.items.map((it, i) =>
      i === index
        ? { ...it, [field]: field === "description" ? value : Number(value) }
        : it,
    );
    formik.setFieldValue("items", items);
  };

  const itemsError =
    typeof formik.errors.items === "string" ? formik.errors.items : undefined;

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    hint: c.email ?? undefined,
  }));

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* z-20: `.vui-glass` sets backdrop-filter => a stacking context per Card,
          so without raising this one the next card paints over the open list. */}
      <Card className="relative z-20 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="customer_id">
            {/* Searchable, matching the invoice/estimate form — scrolling a
                plain select past ~28 customers is slow. */}
            <Combobox
              id="customer_id"
              name="customer_id"
              options={customerOptions}
              value={formik.values.customer_id}
              onChange={(next) => formik.setFieldValue("customer_id", next)}
              emptyLabel="— None —"
              placeholder="Search customers…"
              aria-label="Customer"
            />
          </Field>
          <Field label="Label (internal)" htmlFor="title">
            <input
              id="title"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              placeholder="e.g. Rally monthly retainer"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Repeat every" htmlFor="interval">
            <input
              id="interval"
              name="interval"
              type="number"
              min="1"
              value={formik.values.interval}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="Frequency" htmlFor="frequency">
            <Select
              id="frequency"
              name="frequency"
              value={formik.values.frequency}
              onChange={formik.handleChange}
            >
              <option value="daily">Day(s)</option>
              <option value="weekly">Week(s)</option>
              <option value="monthly">Month(s)</option>
              <option value="yearly">Year(s)</option>
            </Select>
          </Field>
          <Field label="First invoice on" htmlFor="next_run">
            <input
              id="next_run"
              name="next_run"
              type="date"
              value={formik.values.next_run}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="Payment terms (days)" htmlFor="net_days">
            <input
              id="net_days"
              name="net_days"
              type="number"
              min="0"
              value={formik.values.net_days}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="End date (optional)" htmlFor="end_date">
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={formik.values.end_date}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="auto_send"
            checked={formik.values.auto_send}
            onChange={formik.handleChange}
            className="h-4 w-4 rounded border-border text-brand-accent"
          />
          Automatically email the PDF to the customer each time
        </label>

        {/* Which address to bill. Only shown once emailing is on and a customer
            with an address is chosen — otherwise there's nothing to pick. */}
        {formik.values.auto_send && emailOptions.length > 0 && (
          <div className="mt-4 max-w-sm">
            <Field label="Send to" htmlFor="send_to">
              <Select
                id="send_to"
                name="send_to"
                value={formik.values.send_to}
                onChange={formik.handleChange}
              >
                {emailOptions.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {formik.values.auto_send && selectedCustomer && emailOptions.length === 0 && (
          <p className="mt-3 text-sm text-brand-red">
            {selectedCustomer.name} has no email address — add one before this
            schedule can send.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Line items
        </h2>
        <LineItemsEditor
          items={formik.values.items}
          taxRate={formik.values.tax_rate}
          onItemChange={onItemChange}
          onAddRow={() =>
            formik.setFieldValue("items", [...formik.values.items, blankItem()])
          }
          onRemoveRow={(index) =>
            formik.values.items.length > 1 &&
            formik.setFieldValue(
              "items",
              formik.values.items.filter((_, i) => i !== index),
            )
          }
          onTaxRateChange={(value) => formik.setFieldValue("tax_rate", value)}
        />
        {itemsError && <p className="mt-3 text-sm text-brand-red">{itemsError}</p>}
      </Card>

      <Card className="p-6">
        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formik.values.notes}
            onChange={formik.handleChange}
            className={inputClass}
          />
        </Field>
      </Card>

      {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Saving…" : "Create schedule"}
        </Button>
      </div>
    </form>
  );
};
