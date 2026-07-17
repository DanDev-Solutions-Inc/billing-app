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
  ReferenceLine,
} from "recharts";
import { formatMoney } from "@utils/money";
import { CashFlowChartProps } from "@interfaces/components/CashFlowChartProps";

/* Diverging cash-flow bars: money in above the zero line, money out below it.

   Why this shape:
   - Net is the gap around zero, so it needs no third series — the footer
     already states the number. A net line here was a duplicate encoding.
   - The old monotone spline *invented* values between monthly points (dipping
     below zero in months that were never negative, overshooting peaks). Bars
     can only show the months that exist.
   - The negative half of the axis now carries meaning instead of sitting empty.

   Colors come from the brand tokens so they can't drift from globals.css. */
const INCOME = "var(--brand-green)";
const EXPENSE = "var(--brand-red)";
const AXIS = "var(--muted-foreground)";
const GRID = "rgba(255,255,255,0.06)";

const compact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${v < 0 ? "-" : ""}$${Math.round(abs / 1000)}k`;
  return `${v < 0 ? "-" : ""}$${abs}`;
};

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  /* Expenses plot downward. Keep the real value alongside for the tooltip. */
  const plot = data.map((d) => ({ ...d, expenseOut: -d.expense }));

  return (
    /* h-full lets the chart fill the card when the grid row stretches it. */
    <div className="h-full min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={plot}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barGap={4}
          barCategoryGap="14%"
          stackOffset="sign"
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INCOME} stopOpacity={1} />
              <stop offset="100%" stopColor={INCOME} stopOpacity={0.5} />
            </linearGradient>
            {/* Reversed: expense bars grow downward, so the solid end is at
                the bottom and it fades back toward the zero line. */}
            <linearGradient id="expenseFill" x1="0" y1="1" x2="0" y2="0">
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
          {/* The zero line is the reference the whole chart reads against. */}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.22)" />
          <Tooltip
            /* Values are stored negative for layout; show them as real money. */
            formatter={(value) => formatMoney(Math.abs(Number(value)))}
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
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: AXIS }}
          />
          <Bar
            dataKey="income"
            name="In"
            fill="url(#incomeFill)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expenseOut"
            name="Out"
            fill="url(#expenseFill)"
            radius={[0, 0, 6, 6]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
