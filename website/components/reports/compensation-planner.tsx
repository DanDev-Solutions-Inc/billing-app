"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { savePlanAction } from "@app/(app)/reports/actions";
import { CompensationPlannerProps } from "@interfaces/components/CompensationPlannerProps";
import { Button, Field, inputClass } from "@components/ui";
import { BUSINESS } from "@utils/constants";
import { formatMoney, round2 } from "@utils/money";
import {
  computeCompensationScenario,
  findOptimalSalaryShare,
} from "@utils/compensation-scenario";

/**
 * Salary vs dividend what-if for the fiscal year in progress.
 *
 * The only client boundary on /reports — the rest of the page is server-rendered
 * and ships no JS. Everything here is local state and pure arithmetic from
 * `computeCompensationScenario`, the same function the plan figures are derived
 * from, so dragging never touches the network and the numbers can't drift from
 * the server's.
 *
 * Nothing here is money that has moved. Payroll and dividends are never recorded
 * in the ledger, so this is a projection sitting on top of real income and
 * expenses — the UI has to keep saying so.
 */
export const CompensationPlanner = ({
  settings,
  income,
  expenses,
  hstPayable,
}: CompensationPlannerProps) => {
  const [monthly, setMonthly] = useState(settings.monthly_total);
  const [share, setShare] = useState(settings.salary_share_percent);
  const [employerPct, setEmployerPct] = useState(settings.employer_cost_percent);
  const [salaryRate, setSalaryRate] = useState(settings.personal_salary_rate);
  const [dividendRate, setDividendRate] = useState(settings.personal_dividend_rate);
  const [saving, startSaving] = useTransition();

  const input = useMemo(
    () => ({
      income,
      expenses,
      annualTotal: monthly * 12,
      salarySharePercent: share,
      employerCostPercent: employerPct,
      corpTaxRate: BUSINESS.corpTaxRate,
      personalSalaryRate: salaryRate,
      personalDividendRate: dividendRate,
      hstPayable,
    }),
    [income, expenses, monthly, share, employerPct, salaryRate, dividendRate, hstPayable],
  );

  const s = useMemo(() => computeCompensationScenario(input), [input]);

  /* The better split, and what it's actually worth — suppressed unless it saves
     real money. With nothing to split (or a split whose saving rounds to zero)
     every share gives the same answer, so "lowest combined tax at 0% salary,
     $0.00 less" is noise dressed as a recommendation. */
  const better = useMemo(() => {
    if (s.salaryGross + s.dividend <= 0) return null;
    const best = findOptimalSalaryShare(input);
    if (best === null || best === input.salarySharePercent) return null;
    const saving = round2(
      s.combinedTax -
        computeCompensationScenario({ ...input, salarySharePercent: best })
          .combinedTax,
    );
    return saving >= 0.01 ? { share: best, saving } : null;
  }, [input, s]);

  /* "Unsaved" drives the hypothetical styling. The risk being designed against
     is a screenshot of a dragged slider being taken for the real plan. */
  const dirty =
    monthly !== settings.monthly_total ||
    share !== settings.salary_share_percent ||
    employerPct !== settings.employer_cost_percent ||
    salaryRate !== settings.personal_salary_rate ||
    dividendRate !== settings.personal_dividend_rate;

  const save = () => {
    const fd = new FormData();
    fd.set("monthly_total", String(monthly));
    fd.set("salary_share_percent", String(share));
    fd.set("employer_cost_percent", String(employerPct));
    fd.set("personal_salary_rate", String(salaryRate));
    fd.set("personal_dividend_rate", String(dividendRate));
    startSaving(() => {
      void savePlanAction(fd);
    });
  };

  const reset = () => {
    setMonthly(settings.monthly_total);
    setShare(settings.salary_share_percent);
    setEmployerPct(settings.employer_cost_percent);
    setSalaryRate(settings.personal_salary_rate);
    setDividendRate(settings.personal_dividend_rate);
  };

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Total compensation (per month)" htmlFor="monthly_total">
          <input
            id="monthly_total"
            type="number"
            inputMode="decimal"
            min="0"
            step="50"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">
            {formatMoney(monthly * 12)} over a full year
          </p>
        </Field>

        <Field label={`Split — ${share}% salary / ${100 - share}% dividend`} htmlFor="share">
          <input
            id="share"
            type="range"
            min={0}
            max={100}
            step={1}
            value={share}
            onChange={(e) => setShare(Number(e.target.value))}
            className="h-11 w-full accent-[var(--brand-accent)]"
          />
          <p className="text-xs text-muted-foreground">
            {formatMoney(s.salaryGross)} salary · {formatMoney(s.dividend)} dividend
          </p>
        </Field>
      </div>

      {/* Headline — the combined number, because that is the decision */}
      <div
        className={
          "rounded-xl border border-glass-border bg-white/[0.03] p-4 " +
          (dirty ? "italic" : "")
        }
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estimated tax on this plan {dirty && "(unsaved)"}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {formatMoney(s.combinedTax)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Corporate {formatMoney(s.corporateTax)} · Her personal{" "}
          {formatMoney(s.personalTax)} · She keeps {formatMoney(s.netToRecipient)}
        </p>

        {/* The salary portion is the only part that moves corporate tax. */}
        <p className="mt-2 text-sm text-muted-foreground">
          Salary reduces corporate tax by{" "}
          <span className="font-medium text-brand-green">
            {formatMoney(s.corporateTaxOffset)}
          </span>{" "}
          ({formatMoney(s.salaryGross)} salary + {formatMoney(s.employerCost)}{" "}
          employer CPP/EI, deducted at {BUSINESS.corpTaxRate}%). Dividends are paid
          from after-tax profit, so they reduce it by nothing.
        </p>

        {better && (
          <p className="mt-2 text-sm text-brand-accent">
            Lowest combined tax at <strong>{better.share}% salary</strong> —{" "}
            {formatMoney(better.saving)} less than this split.{" "}
            <button
              type="button"
              onClick={() => setShare(better.share)}
              className="underline underline-offset-2"
            >
              Use it
            </button>
          </p>
        )}
      </div>

      {/* Warnings — each is a case where the plain number would mislead */}
      {!s.dividendFunded && (
        <Warning>
          A {formatMoney(s.dividend)} dividend needs that much after-tax profit;
          there is {formatMoney(s.afterTaxProfit)}. It can&rsquo;t be declared as
          things stand — reduce it, or shift toward salary.
        </Warning>
      )}

      {s.pastBreakEven && s.salaryCost > 0 && (
        <Warning>
          This salary already brings net income to nil. Another dollar of salary
          offsets <strong>{formatMoney(0)}</strong> of corporate tax — the
          reduction stops at {formatMoney(s.corporateTaxWithoutComp)}, because
          that is all the tax there was.
        </Warning>
      )}

      {share === 0 && monthly > 0 && (
        <Note>
          All dividend means no CPP contributions and no RRSP room for her — real
          costs that these tax figures don&rsquo;t capture.
        </Note>
      )}

      {/* Where the money lands */}
      <div className="grid gap-3 border-t border-white/[0.06] pt-4 text-sm sm:grid-cols-3">
        <Line label="Net income after salary" value={formatMoney(s.netIncome)} />
        <Line label="Profit left after corporate tax" value={formatMoney(s.afterTaxProfit)} />
        <Line
          label="To set aside (HST + corporate tax)"
          value={formatMoney(s.setAsideTarget)}
        />
      </div>

      {/* Assumptions, tucked away but adjustable */}
      <details className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Assumptions
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Pct label="Employer CPP/EI" value={employerPct} onChange={setEmployerPct} id="employer_cost_percent" />
          <Pct label="Her tax on salary" value={salaryRate} onChange={setSalaryRate} id="personal_salary_rate" />
          <Pct label="Her tax on dividends" value={dividendRate} onChange={setDividendRate} id="personal_dividend_rate" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          The personal rates are flat effective estimates standing in for
          progressive brackets, the dividend gross-up and the dividend tax credit.
          Real personal tax rises with income, so the best split shifts as she
          earns more. Tune these with your accountant.
        </p>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save as my plan"}
        </Button>
        {dirty && (
          <Button type="button" variant="secondary" onClick={reset}>
            Reset to saved
          </Button>
        )}
      </div>
    </div>
  );
};

const Line = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-0.5 tabular-nums text-foreground">{value}</p>
  </div>
);

const Pct = ({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  id: string;
}) => (
  <Field label={`${label} (%)`} htmlFor={id}>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min="0"
      max="100"
      step="0.1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={inputClass}
    />
  </Field>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-foreground">
    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand-red" />
    <span>{children}</span>
  </p>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-start gap-2 rounded-xl border border-glass-border bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
    <Info className="mt-0.5 size-4 shrink-0" />
    <span>{children}</span>
  </p>
);
