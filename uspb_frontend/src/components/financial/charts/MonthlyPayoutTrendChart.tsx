"use client";

import React, { useState } from "react";
import { MonthlyTrendDataPoint } from "@/types";
import { TrendingUp, Calendar, Coins } from "lucide-react";

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface MonthlyPayoutTrendChartProps {
  data: MonthlyTrendDataPoint[];
  isLoading?: boolean;
}

export function MonthlyPayoutTrendChart({
  data,
  isLoading = false,
}: MonthlyPayoutTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalPayout = data.reduce((acc, d) => acc + d.cash_payout_lkr, 0);
  const maxVal = Math.max(...data.map((d) => d.cash_payout_lkr), 100000);

  // SVG dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute points
  const points = data.map((d, i) => {
    const x =
      data.length > 1
        ? paddingLeft + (i / (data.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const y = paddingTop + chartHeight - (d.cash_payout_lkr / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  // Construct SVG path for area & line
  const linePath =
    points.length > 0
      ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${
          points[0].x
        } ${paddingTop + chartHeight} Z`
      : "";

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif">
              Monthly Cash Payout Trends
            </h4>
            <p className="text-[10px] text-stone-500">
              Disbursed municipal reward grants across calendar months
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-stone-400 block uppercase">
            Period Total
          </span>
          <span className="font-mono text-xs font-bold text-emerald-800">
            {formatLKR(totalPayout)}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-stone-400">
            Loading payout trends...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = paddingTop + chartHeight * (1 - pct);
              const val = maxVal * pct;
              return (
                <g key={pct}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#f0ece6"
                    strokeDasharray={pct === 0 ? "none" : "3,3"}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-stone-400 font-mono"
                  >
                    {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#payoutGradient)" />}

            {/* Line Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points & Interaction Hover */}
            {points.map((p, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <g
                  key={p.data.month}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? "#047857" : "#ffffff"}
                    stroke="#059669"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all"
                  />
                  {/* Month Label */}
                  <text
                    x={p.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[9px] font-medium transition-colors ${
                      isHovered ? "fill-stone-900 font-bold" : "fill-stone-400"
                    }`}
                  >
                    {p.data.month_label.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip / Detail Card */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-2 rounded-lg border border-emerald-200 bg-emerald-50/95 px-2.5 py-1.5 text-xs shadow-xs text-emerald-950 backdrop-blur-xs">
            <span className="font-bold block text-[11px]">
              {data[hoveredIdx].month_label}
            </span>
            <span className="font-mono text-emerald-800 font-semibold text-[11px]">
              {formatLKR(data[hoveredIdx].cash_payout_lkr)}
            </span>
            <span className="block text-[9px] text-emerald-700/80">
              {data[hoveredIdx].voucher_count} voucher(s) issued
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-stone-400" /> Fiscal Period: Jul - Nov 2026
        </span>
        <span className="font-medium text-emerald-800">
          Peak: {formatLKR(maxVal)}
        </span>
      </div>
    </div>
  );
}
