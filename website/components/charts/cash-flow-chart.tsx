"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMoney } from "@utils/money";
import { CashFlowChartProps } from "@interfaces/components/CashFlowChartProps";

const GREEN = "#37c98b"; /* brand-green (dark-tuned) — income */
const GREY = "#6b6b74"; /* neutral — expenses */
const INK = "#e5e5e5"; /* near-white — net line on dark */
const AXIS = "#a1a1aa"; /* muted-foreground */
const GRID = "rgba(255,255,255,0.08)";

export const CashFlowChart = ({ data }: CashFlowChartProps) => (
  <ResponsiveContainer width="100%" height={300}>
    <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 12, fill: AXIS }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 12, fill: AXIS }}
        axisLine={false}
        tickLine={false}
        width={70}
        tickFormatter={(v) => formatMoney(v).replace(".00", "")}
      />
      <Tooltip
        formatter={(value) => formatMoney(Number(value))}
        cursor={{ fill: "rgba(255,255,255,0.05)" }}
        contentStyle={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#26262a",
          color: "#fafafa",
          fontSize: 13,
        }}
        labelStyle={{ color: "#fafafa" }}
      />
      <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} />
      <Bar dataKey="income" name="Income" fill={GREEN} radius={[4, 4, 0, 0]} />
      <Bar dataKey="expense" name="Expenses" fill={GREY} radius={[4, 4, 0, 0]} />
      <Line
        type="monotone"
        dataKey="net"
        name="Net"
        stroke={INK}
        strokeWidth={2}
        dot={{ r: 3 }}
      />
    </ComposedChart>
  </ResponsiveContainer>
);
