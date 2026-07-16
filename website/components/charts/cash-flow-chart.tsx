"use client";

import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMoney } from "@utils/money";
import { CashFlowChartProps } from "@interfaces/components/CashFlowChartProps";

/* Vision UI chart language: gradient area fill under a bright line, thin
   rounded bars, recessive grid, glass tooltip. DanDev blue/green/red. */
const INCOME = "#2ecc8f";
const EXPENSE = "#e8615a";
const NET = "#5c9bf5"; /* brand accent — the hero line */
const AXIS = "#9fb0c9";
const GRID = "rgba(255,255,255,0.06)";

const compact = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
  return `${sign}$${abs}`;
};

export const CashFlowChart = ({ data }: CashFlowChartProps) => (
  /* h-full lets the chart fill the card when the grid row stretches it. */
  <div className="h-full min-h-[320px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        barGap={2}
      >
        <defs>
          {/* Vision UI's signature: a soft brand gradient under the net line. */}
          <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={NET} stopOpacity={0.35} />
            <stop offset="100%" stopColor={NET} stopOpacity={0} />
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
        {/* NOTE: do not set an explicit `domain`/`ticks` here — this version of
            recharts then scales <Bar> off a different (wrong) domain than the
            axis, rendering the bars far too short. Auto domain is correct. */}
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
            background: "rgba(16,28,56,0.95)",
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
          name="Income"
          fill={INCOME}
          radius={[4, 4, 0, 0]}
          maxBarSize={12}
        />
        <Bar
          dataKey="expense"
          name="Expenses"
          fill={EXPENSE}
          radius={[4, 4, 0, 0]}
          maxBarSize={12}
        />
        <Area
          type="monotone"
          dataKey="net"
          name="Net"
          stroke={NET}
          strokeWidth={2.5}
          fill="url(#netFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
