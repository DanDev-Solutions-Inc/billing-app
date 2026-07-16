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

/* Vision UI chart language: gradient area fill under a bright line, thick
   rounded bars, recessive grid, glass tooltip. DanDev blue/green/red.

   No `maxBarSize`: bars fill their category band, so the series spans the plot
   end-to-end and thickness scales with the selected range (fat at 3 months,
   slim at 24) instead of clustering with dead space around a fixed width. */
/* Pull straight from the brand tokens so the chart can never drift out of
   sync with the palette in globals.css. */
const INCOME = "var(--brand-green)";
const EXPENSE = "var(--brand-red)";
const NET = "var(--brand-accent)"; /* the hero line */
const AXIS = "var(--muted-foreground)";
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
        barGap={4}
        barCategoryGap="14%"
      >
        <defs>
          {/* Vision UI's signature: a soft brand gradient under the net line. */}
          <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={NET} stopOpacity={0.35} />
            <stop offset="100%" stopColor={NET} stopOpacity={0} />
          </linearGradient>
          {/* Bars fade toward the baseline so they sit on the surface rather
              than looking pasted onto it. */}
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INCOME} stopOpacity={1} />
            <stop offset="100%" stopColor={INCOME} stopOpacity={0.45} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXPENSE} stopOpacity={1} />
            <stop offset="100%" stopColor={EXPENSE} stopOpacity={0.45} />
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
        {/* Net renders FIRST so its gradient area reads as the background trend
            and the bars sit crisply on top of it, rather than the line cutting
            across them. */}
        <Area
          type="monotone"
          dataKey="net"
          name="Net"
          stroke={NET}
          strokeWidth={2.5}
          fill="url(#netFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Bar
          dataKey="income"
          name="Income"
          fill="url(#incomeFill)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Expenses"
          fill="url(#expenseFill)"
          radius={[6, 6, 0, 0]}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
