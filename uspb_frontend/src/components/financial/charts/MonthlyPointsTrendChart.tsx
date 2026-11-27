"use client";

import React, { useState } from "react";
import { MonthlyTrendDataPoint } from "@/types";
import { Sparkles, Calendar } from "lucide-react";

export interface MonthlyPointsTrendChartProps {
  data: MonthlyTrendDataPoint[];
  isLoading?: boolean;
}

export function MonthlyPointsTrendChart({
  data,
  isLoading = false,
}: MonthlyPointsTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalPoints = data.reduce((acc, d) => acc + d.points_redeemed, 0);
  const maxVal = Math.max(...data.map((d) => d.points_redeemed), 50000);

  // SVG dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barWidth = Math.min(36, chartWidth / (data.length * 1.6));

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif">
              Monthly Points Redemption Trends
            </h4>
            <p className="text-[10px] text-stone-500">
              Student eco-points converted into school rewards
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-stone-400 block uppercase">
            Redeemed Points
          </span>
          <span className="font-mono text-xs font-bold text-amber-800">
            {totalPoints.toLocaleString("en-LK")} pts
          </span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative w-full overflow-hidden">
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-stone-400">
            Loading points trends...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="pointsBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#d97706" />
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

            {/* Bars */}
            {data.map((d, i) => {
              const xCenter =
                data.length > 1
                  ? paddingLeft + (i / (data.length - 1)) * chartWidth
                  : paddingLeft + chartWidth / 2;
              const x = xCenter - barWidth / 2;
              const barH = (d.points_redeemed / maxVal) * chartHeight;
              const y = paddingTop + chartHeight - barH;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={d.month}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    rx={4}
                    fill={isHovered ? "#92400e" : "url(#pointsBarGradient)"}
                    className="transition-all"
                  />

                  {/* Value atop bar (if > 0) */}
                  {d.points_redeemed > 0 && (
                    <text
                      x={xCenter}
                      y={y - 4}
                      textAnchor="middle"
                      className="text-[8px] font-mono font-bold fill-stone-600"
                    >
                      {Math.round(d.points_redeemed / 1000)}k
                    </text>
                  )}

                  {/* Month Label */}
                  <text
                    x={xCenter}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[9px] font-medium transition-colors ${
                      isHovered ? "fill-stone-900 font-bold" : "fill-stone-400"
                    }`}
                  >
                    {d.month_label.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-2 rounded-lg border border-amber-200 bg-amber-50/95 px-2.5 py-1.5 text-xs shadow-xs text-amber-950 backdrop-blur-xs">
            <span className="font-bold block text-[11px]">
              {data[hoveredIdx].month_label}
            </span>
            <span className="font-mono text-amber-800 font-semibold text-[11px]">
              {data[hoveredIdx].points_redeemed.toLocaleString("en-LK")} pts
            </span>
            <span className="block text-[9px] text-amber-700/80">
              {data[hoveredIdx].waste_collected_kg.toLocaleString("en-LK")} kg collected
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-stone-400" /> Active Points Velocity
        </span>
        <span className="font-medium text-amber-800">
          Conversion Rate: 100% Guaranteed
        </span>
      </div>
    </div>
  );
}
