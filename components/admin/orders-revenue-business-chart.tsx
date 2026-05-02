"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Point = {
  day: string;
  count: number;
  revenuePaise: number;
};

function formatCompactRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrdersRevenueBusinessChart({ points }: { points: Point[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    const maxCount = Math.max(1, ...points.map((p) => p.count));
    const maxRevenuePaise = Math.max(1, ...points.map((p) => p.revenuePaise));
    const totalOrders = points.reduce((sum, p) => sum + p.count, 0);
    const totalRevenuePaise = points.reduce((sum, p) => sum + p.revenuePaise, 0);
    const avgOrders = points.length ? totalOrders / points.length : 0;
    const avgRevenuePaise = points.length ? totalRevenuePaise / points.length : 0;
    const aovPaise = totalOrders > 0 ? totalRevenuePaise / totalOrders : 0;
    const topOrderDay = points.reduce((best, p) => (p.count > best.count ? p : best), points[0]);
    const topRevenueDay = points.reduce(
      (best, p) => (p.revenuePaise > best.revenuePaise ? p : best),
      points[0]
    );
    return {
      maxCount,
      maxRevenuePaise,
      totalOrders,
      totalRevenuePaise,
      avgOrders,
      avgRevenuePaise,
      aovPaise,
      topOrderDay,
      topRevenueDay,
    };
  }, [points]);

  const width = 980;
  const height = 320;
  const topPad = 14;
  const bottomPad = 40;
  const leftPad = 14;
  const rightPad = 14;
  const chartW = width - leftPad - rightPad;
  const chartH = height - topPad - bottomPad;
  const stepX = points.length > 1 ? chartW / (points.length - 1) : chartW;

  const linePoints = points
    .map((p, i) => {
      const x = leftPad + i * stepX;
      const y = topPad + chartH - (p.revenuePaise / stats.maxRevenuePaise) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath =
    points.length > 0
      ? `M ${leftPad},${topPad + chartH} L ${linePoints
          .split(" ")
          .join(" L ")} L ${leftPad + chartW},${topPad + chartH} Z`
      : "";

  const activePoint = activeIndex != null ? points[activeIndex] : null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Paid Orders vs Revenue
          </h2>
          <p className="text-sm text-muted-foreground">
            Only paid orders counted for chart accuracy (last 14 days)
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <KpiCard label="Paid orders" value={String(stats.totalOrders)} />
          <KpiCard label="Revenue" value={formatCompactRupees(stats.totalRevenuePaise / 100)} />
          <KpiCard label="AOV" value={formatRupees(stats.aovPaise / 100)} />
          <KpiCard label="Avg paid/day" value={stats.avgOrders.toFixed(1)} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald-500" />
          Paid orders (bars)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-500" />
          Revenue (line)
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-background p-3">
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-72 w-full"
            role="img"
            aria-label="Paid orders and revenue trend"
          >
            <defs>
              <linearGradient id="vgBusinessRevenueArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(59 130 246 / 0.35)" />
                <stop offset="100%" stopColor="rgb(59 130 246 / 0.05)" />
              </linearGradient>
            </defs>

            {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
              const y = topPad + chartH * ratio;
              return (
                <line
                  key={ratio}
                  x1={leftPad}
                  y1={y}
                  x2={leftPad + chartW}
                  y2={y}
                  stroke="rgb(148 163 184 / 0.2)"
                  strokeDasharray="4 5"
                />
              );
            })}

            {points.map((p, i) => {
              const x = leftPad + i * stepX;
              const barHeight = (p.count / stats.maxCount) * chartH;
              const y = topPad + chartH - barHeight;
              const barWidth = Math.max(12, stepX * 0.58);
              const isActive = activeIndex === i;
              return (
                <g key={p.day}>
                  <rect
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={Math.max(4, barHeight)}
                    rx={8}
                    fill={isActive ? "rgb(5 150 105)" : "rgb(16 185 129 / 0.85)"}
                  />
                  {i % 2 === 0 && (
                    <text
                      x={x}
                      y={height - 10}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {p.day.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}

            {points.length > 0 && <path d={areaPath} fill="url(#vgBusinessRevenueArea)" />}
            {points.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke="rgb(37 99 235)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((p, i) => {
              const x = leftPad + i * stepX;
              const y = topPad + chartH - (p.revenuePaise / stats.maxRevenuePaise) * chartH;
              const isActive = activeIndex === i;
              return (
                <circle
                  key={`${p.day}-dot`}
                  cx={x}
                  cy={y}
                  r={isActive ? 5 : 3.5}
                  fill={isActive ? "rgb(30 64 175)" : "rgb(37 99 235)"}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 grid grid-cols-14">
            {points.map((p, i) => (
              <button
                key={`${p.day}-hit`}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
                className="h-full w-full"
                aria-label={`Day ${p.day}: ${p.count} paid orders and ${formatRupees(
                  p.revenuePaise / 100
                )} revenue`}
              />
            ))}
          </div>

          {activePoint && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs shadow-md">
              <p className="font-semibold text-foreground">{activePoint.day}</p>
              <p className="text-emerald-600">Paid orders: {activePoint.count}</p>
              <p className="text-blue-600">
                Revenue: {formatRupees(activePoint.revenuePaise / 100)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InsightCard
          title="Peak paid orders day"
          value={`${stats.topOrderDay?.day.slice(5) ?? "--"} · ${stats.topOrderDay?.count ?? 0} orders`}
          tone="emerald"
        />
        <InsightCard
          title="Peak revenue day"
          value={`${stats.topRevenueDay?.day.slice(5) ?? "--"} · ${formatRupees(
            (stats.topRevenueDay?.revenuePaise ?? 0) / 100
          )}`}
          tone="blue"
        />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function InsightCard({ title, value, tone }: { title: string; value: string; tone: "emerald" | "blue" }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold tabular-nums",
          tone === "emerald" ? "text-emerald-600" : "text-blue-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}
