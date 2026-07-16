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

const GREEN = "#1f9d6b";
const GREY = "#cbd2da";
const INK = "#151515";

export const CashFlowChart = ({ data }: CashFlowChartProps) => (
  <ResponsiveContainer width="100%" height={300}>
    <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 12, fill: "#64707d" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 12, fill: "#64707d" }}
        axisLine={false}
        tickLine={false}
        width={70}
        tickFormatter={(v) => formatMoney(v).replace(".00", "")}
      />
      <Tooltip
        formatter={(value) => formatMoney(Number(value))}
        contentStyle={{
          borderRadius: 12,
          border: "1px solid #e3e7ec",
          fontSize: 13,
        }}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
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
