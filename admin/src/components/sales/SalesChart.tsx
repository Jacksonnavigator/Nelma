import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTZS } from "@/lib/format";

const SERIES_COLORS = [
  "hsl(var(--chart-1, 217 79% 66%))",
  "hsl(var(--chart-2, 203 47% 70%))",
  "hsl(var(--chart-3, 144 44% 67%))",
  "hsl(var(--chart-4, 168 58% 70%))",
  "hsl(var(--chart-5, 38 92% 62%))",
  "hsl(var(--chart-6, 0 72% 62%))",
];

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SalesTrendChart({
  title = "Sales trend",
  data,
}: {
  title?: string;
  data: { date: string; sales: number }[];
}) {
  return (
    <Frame title={title}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={64}
          tickFormatter={(v: number) => formatTZS(v, { compact: true })}
        />
        <Tooltip formatter={(v: number) => formatTZS(v)} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke={SERIES_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </Frame>
  );
}

export function CountBarChart({
  title,
  data,
  dataKey = "count",
}: {
  title: string;
  data: { label: string; count?: number; orders?: number }[];
  dataKey?: "count" | "orders";
}) {
  return (
    <Frame title={title}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function DistributionChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number }[];
}) {
  return (
    <Frame title={title}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={52}
          outerRadius={86}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </Frame>
  );
}
