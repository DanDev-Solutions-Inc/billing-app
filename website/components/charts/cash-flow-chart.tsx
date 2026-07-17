"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { formatMoney } from "@utils/money";
import { CashFlowChartProps } from "@interfaces/components/CashFlowChartProps";

/* Income vs Expense comparison: grouped bars per month, both above a zero
   baseline, with the value labelled directly on each bar.

   Net isn't plotted — it's the gap between the pair, and the footer states the
   number. (An earlier version drew a smoothed net line, which invented values
   between monthly points and dipped below zero in months that never were.)

   Colors come from the brand tokens so they can't drift from globals.css. */
const INCOME = "var(--brand-green)";
const EXPENSE = "var(--brand-red)";
const AXIS = "var(--muted-foreground)";
const GRID = "rgba(255,255,255,0.06)";

/** Axis ticks: $21k. */
const compact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `$${Math.round(abs / 1000)}k`;
  return `$${Math.round(abs)}`;
};

/** Bar labels: hide zeros so empty months stay clean. */
const barLabel = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? compact(n) : "";
};

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  /* Direct labels need room: each label is ~25px wide, and the gap between a
     month's two bar centres shrinks as the range grows. Past 6 months the
     pairs overlap ("$622$502"), so drop to the tooltip instead. */
  const showLabels = data.length <= 6;

  return (
    /* h-full lets the chart fill the card when the grid row stretches it. */
    <div className="h-full min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 4, bottom: 0, left: 0 }}
          barGap={8}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INCOME} stopOpacity={1} />
              <stop offset="100%" stopColor={INCOME} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE} stopOpacity={1} />
              <stop offset="100%" stopColor={EXPENSE} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: AXIS }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 12, fill: AXIS }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={compact}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "var(--navy-700)",
              backdropFilter: "blur(20px)",
              color: "#ffffff",
              fontSize: 13,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
            labelStyle={{ color: "#ffffff", fontWeight: 700, marginBottom: 4 }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            height={32}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: AXIS }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill="url(#incomeFill)"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          >
            {showLabels && (
              <LabelList
                dataKey="income"
                position="top"
                formatter={barLabel}
                style={{ fill: "#ffffff", fontSize: 10, fontWeight: 600 }}
              />
            )}
          </Bar>
          <Bar
            dataKey="expense"
            name="Expenses"
            fill="url(#expenseFill)"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          >
            {showLabels && (
              <LabelList
                dataKey="expense"
                position="top"
                formatter={barLabel}
                style={{ fill: "#ffffff", fontSize: 10, fontWeight: 600 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
