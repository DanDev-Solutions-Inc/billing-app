"use client";

import { useActionState } from "react";
import { syncFromWave, type WaveSyncState } from "@app/(app)/settings/actions";
import { Button } from "@components/ui";

const initial: WaveSyncState = {};

export const WaveSync = () => {
  const [state, action, pending] = useActionState(syncFromWave, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Import customers, invoices, and estimates from your Wave account. Re-run
        anytime — existing records are updated, not duplicated. A full import can
        take a couple of minutes.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Syncing from Wave…" : "Sync from Wave"}
        </Button>
        <a
          href="/wave/connect"
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          Connect a different Wave account
        </a>
      </div>

      {state.error && <p className="text-sm text-brand-red">{state.error}</p>}

      {state.summary && (
        <div className="rounded-lg bg-brand-green/10 px-4 py-3 text-sm text-brand-green">
          Imported from <strong>{state.summary.businessName}</strong>:{" "}
          {state.summary.customers} customers, {state.summary.invoices} invoices,{" "}
          {state.summary.estimates} estimates, {state.summary.transactions}{" "}
          transactions.
        </div>
      )}
    </form>
  );
};
