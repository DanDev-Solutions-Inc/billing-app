"use client";

import { useFormik } from "formik";
import { inviteMemberAction } from "@app/(app)/settings/team-actions";
import { inviteSchema } from "@utils/validation/inviteSchema";
import { InviteFormValues } from "@interfaces/forms/InviteFormValues";
import { Field, inputClass, Button, Select } from "@components/ui";

export const TeamInviteForm = () => {
  const formik = useFormik<InviteFormValues>({
    initialValues: { email: "", role: "viewer" },
    validationSchema: inviteSchema,
    onSubmit: async (values, { setStatus, resetForm }) => {
      const formData = new FormData();
      formData.set("email", values.email);
      formData.set("role", values.role);
      const result = await inviteMemberAction({}, formData);
      if (result?.error) setStatus({ error: result.error });
      else {
        setStatus({ ok: result?.ok });
        resetForm();
      }
    },
  });

  const status = formik.status as { error?: string; ok?: string } | undefined;

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="accountant@firm.com"
            className={inputClass}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-xs text-brand-red">{formik.errors.email}</p>
          )}
        </Field>
        <Field label="Access" htmlFor="role">
          <Select
            id="role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
          >
            <option value="viewer">View &amp; export</option>
            <option value="editor">Full edit</option>
          </Select>
        </Field>
      </div>

      {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}
      {status?.ok && <p className="text-sm text-brand-green">{status.ok}</p>}

      <div>
        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Inviting…" : "Invite"}
        </Button>
      </div>
    </form>
  );
};
