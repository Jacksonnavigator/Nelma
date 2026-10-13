import { cloneElement, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTZS } from "@/lib/format";
import { CHART_COLORS } from "@/lib/chart-colors";

const SERIES_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.orange,
  CHART_COLORS.purple,
  CHART_COLORS.yellow,
  CHART_COLORS.red,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
  CHART_COLORS.sky,
  CHART_COLORS.gray,
];

const colorAt = (i: number, color?: string) => color ?? SERIES_COLORS[i % SERIES_COLORS.length];

function Frame({
  title,
  children,
  footer,
  bare = false,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bare?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={bare ? "chart-bare" : "rounded-xl border border-border bg-card p-5 sm:p-6"}>
      {!bare && <p className="text-base font-semibold text-foreground">{title}</p>}
      <div ref={container} className="mt-3 h-64">
        {width > 0 &&
          cloneElement(children as React.ReactElement<{ width: number; height: number }>, {
            width,
            height: 256,
            key: width,
          })}
      </div>
      {footer}
    </div>
  );
}

export function SalesTrendChart({
  title = "Sales trend",
  data,
  bare = false,
}: {
  title?: string;
  bare?: boolean;
  data: { date: string; sales: number }[];
}) {
  return (
    <Frame title={`${title} (TZS)`} bare={bare}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tick={{ fill: "var(--muted-foreground)" }}
          width={64}
          tickFormatter={(v: number) => formatTZS(v, { compact: true }).replace("TZS ", "")}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            color: "var(--foreground)",
            borderColor: "var(--border)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "var(--foreground)" }}
          formatter={(v: number) => formatTZS(v)}
        />
        <Line
          isAnimationActive={false}
          type="monotone"
          dataKey="sales"
          stroke="var(--primary)"
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
  data: { label: string; count?: number; orders?: number; color?: string | undefined }[];
  dataKey?: "count" | "orders";
}) {
  return (
    <Frame title={title}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tick={{ fill: "var(--muted-foreground)" }}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tick={{ fill: "var(--muted-foreground)" }}
          width={36}
          allowDecimals={false}
        />
        <Tooltip cursor={{ fill: "rgba(100,116,139,0.08)" }} />
        <Bar isAnimationActive={false} dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((item, i) => (
            <Cell key={item.label} fill={colorAt(i, item.color)} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

const percentOf = (count: number, total: number) =>
  total ? `${Math.round((count / total) * 100)}%` : "0%";

/** Ring chart with one colour per slice and a legend showing each part's share. */
export function DistributionChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number; color?: string | undefined }[];
}) {
  const shown = data.filter((item) => item.count > 0);
  const total = shown.reduce((sum, item) => sum + item.count, 0);
  const colored = shown.map((item, i) => ({ ...item, fill: colorAt(i, item.color) }));

  return (
    <Frame
      title={title}
      footer={
        total ? (
          <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {colored.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                  aria-hidden="true"
                />
                <span className="truncate text-foreground">{item.label}</span>
                <span className="ml-auto font-semibold text-foreground">
                  {percentOf(item.count, total)}
                </span>
                <span className="w-8 text-right text-muted-foreground">{item.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Nothing to show for this period.
          </p>
        )
      }
    >
      <PieChart>
        <Pie
          isAnimationActive={false}
          data={colored}
          dataKey="count"
          nameKey="label"
          innerRadius={52}
          outerRadius={86}
          paddingAngle={colored.length > 1 ? 2 : 0}
          label={({ percent }: { percent: number }) =>
            percent >= 0.05 ? `${Math.round(percent * 100)}%` : ""
          }
          labelLine={false}
        >
          {colored.map((item) => (
            <Cell key={item.label} fill={item.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} (${percentOf(value, total)})`,
            name,
          ]}
        />
      </PieChart>
    </Frame>
  );
}
