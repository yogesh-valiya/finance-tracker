"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/analytics/donut-chart";

export interface TrendPoint {
  label: string;
  month?: string; // backward compat
  monthIndex?: number;
  index: number;
  date?: string;
  amount: number;
  subcategories?: Record<string, number>;
}

interface TrendChartProps {
  data: TrendPoint[];
  color?: string;
  granularity?: "monthly" | "annually" | "weekly" | "custom";
  subSeries?: string[];
  showMultiLine?: boolean;
  activePointIndex?: number | null;
  startPointIndex?: number | null;
  endPointIndex?: number | null;
  onSelectPoint?: (index: number) => void;
  onSelectRange?: (startIndex: number, endIndex: number) => void;
  onClearRange?: () => void;

  // Backwards compatibility props
  activeMonth?: number | null;
  startMonth?: number | null;
  endMonth?: number | null;
  onSelectMonth?: (month: number) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TrendChart({
  data,
  color = "var(--primary)",
  granularity = "monthly",
  subSeries = [],
  showMultiLine = false,
  activePointIndex,
  startPointIndex,
  endPointIndex,
  onSelectPoint,
  onSelectRange,
  onClearRange,
  activeMonth,
  startMonth,
  endMonth,
  onSelectMonth,
}: TrendChartProps) {
  const [dragStart, setDragStart] = React.useState<string | null>(null);
  const [dragEnd, setDragEnd] = React.useState<string | null>(null);
  const isDraggingRef = React.useRef(false);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Resolve active start/end indices from either new or legacy props
  const resolvedStartIdx = startPointIndex ?? startMonth ?? null;
  const resolvedEndIdx = endPointIndex ?? endMonth ?? null;
  const resolvedActiveIdx = activePointIndex ?? activeMonth ?? null;

  // Helper to get item index by label
  const getIndexByLabel = (label: string): number => {
    const point = data.find((d) => d.label === label || d.month === label);
    if (point) return point.index ?? point.monthIndex ?? 1;
    const mIdx = MONTH_NAMES.indexOf(label);
    if (mIdx !== -1) return mIdx + 1;
    const parsed = parseInt(label, 10);
    return !isNaN(parsed) ? parsed : 1;
  };

  // Drag Handlers
  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setDragStart(e.activeLabel);
      setDragEnd(e.activeLabel);
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDraggingRef.current && e && e.activeLabel) {
      setDragEnd(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (dragStart && dragEnd && dragStart !== dragEnd) {
      const idx1 = getIndexByLabel(dragStart);
      const idx2 = getIndexByLabel(dragEnd);
      const s = Math.min(idx1, idx2);
      const e = Math.max(idx1, idx2);
      onSelectRange?.(s, e);
    } else if (dragStart) {
      const idx = getIndexByLabel(dragStart);
      if (onSelectPoint) {
        onSelectPoint(idx);
      } else if (onSelectMonth) {
        onSelectMonth(idx);
      }
    }
    setDragStart(null);
    setDragEnd(null);
  };

  // Global mouseup listener
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleMouseUp();
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragStart, dragEnd]);

  // Persistent active range highlight bounds
  const hasRange = Boolean(resolvedStartIdx && resolvedEndIdx);
  const isMultiPointRange = Boolean(hasRange && resolvedStartIdx !== resolvedEndIdx);

  const minIdx = hasRange ? Math.min(resolvedStartIdx!, resolvedEndIdx!) : null;
  const maxIdx = hasRange ? Math.max(resolvedStartIdx!, resolvedEndIdx!) : null;

  const activeRangeX1 = minIdx !== null ? data.find((d) => (d.index ?? d.monthIndex) === minIdx)?.label : null;
  const activeRangeX2 = maxIdx !== null ? data.find((d) => (d.index ?? d.monthIndex) === maxIdx)?.label : null;

  // Single point highlight
  const singleIdx = hasRange && minIdx === maxIdx ? minIdx : resolvedActiveIdx;
  const activePoint =
    singleIdx && !isMultiPointRange
      ? data.find((d) => (d.index ?? d.monthIndex) === singleIdx)
      : null;

  const handlePillClick = (idx: number) => {
    if (onSelectPoint) {
      onSelectPoint(idx);
    } else if (onSelectMonth) {
      onSelectMonth(idx);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full h-56 pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval={granularity === "monthly" && data.length > 20 ? 4 : "preserveEnd"}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as TrendPoint;
                  return (
                    <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-md text-xs pointer-events-none max-w-[220px]">
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1 mb-1.5">
                        <span className="font-semibold text-popover-foreground">
                          {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : item.label}
                        </span>
                        <span className="font-bold text-foreground tabular-nums">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>

                      {/* Subcategory breakdown list if multi-line is active */}
                      {showMultiLine && item.subcategories && Object.keys(item.subcategories).length > 0 && (
                        <div className="flex flex-col gap-1 pt-0.5">
                          {subSeries.map((sName, sIdx) => {
                            const sAmt = item.subcategories?.[sName] || 0;
                            if (sAmt <= 0) return null;
                            const sColor = CATEGORY_COLORS[sIdx % CATEGORY_COLORS.length];
                            return (
                              <div key={sName} className="flex items-center justify-between text-[11px] gap-2">
                                <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: sColor }} />
                                  <span className="truncate">{sName}</span>
                                </span>
                                <span className="font-medium tabular-nums text-foreground shrink-0">
                                  {formatCurrency(sAmt)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Persistent Active Filter Range Highlight */}
            {activeRangeX1 && activeRangeX2 && (
              <ReferenceArea
                x1={activeRangeX1}
                x2={activeRangeX2}
                fill="var(--primary)"
                fillOpacity={0.16}
                stroke="var(--primary)"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            )}

            {/* In-progress Drag Selection Preview */}
            {dragStart && dragEnd && dragStart !== dragEnd && (
              <ReferenceArea
                x1={dragStart}
                x2={dragEnd}
                fill="var(--primary)"
                fillOpacity={0.28}
                stroke="var(--primary)"
              />
            )}

            {/* Single Selected Point Highlight */}
            {activePoint && !showMultiLine && (
              <ReferenceDot
                x={activePoint.label}
                y={activePoint.amount}
                r={6}
                fill={color}
                stroke="var(--background)"
                strokeWidth={2}
              />
            )}

            {/* Multi-Line (Separate Subcategories) or Single Aggregate Line */}
            {showMultiLine && subSeries.length > 0 ? (
              subSeries.map((sName, sIdx) => {
                const sColor = CATEGORY_COLORS[sIdx % CATEGORY_COLORS.length];
                return (
                  <Line
                    key={sName}
                    type="monotone"
                    dataKey={`subcategories.${sName}`}
                    name={sName}
                    stroke={sColor}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: sColor }}
                    activeDot={{ r: 5 }}
                  />
                );
              })
            ) : (
              <Line
                type="monotone"
                dataKey="amount"
                name="Total"
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: color, cursor: "pointer" }}
                activeDot={{ r: 6, cursor: "pointer" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subcategory Color Legend (if Multi-line is active) */}
      {showMultiLine && subSeries.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2 px-2 text-[10px]">
          {subSeries.map((sName, sIdx) => (
            <span key={sName} className="flex items-center gap-1 text-muted-foreground">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[sIdx % CATEGORY_COLORS.length] }}
              />
              <span className="truncate max-w-[120px] font-medium">{sName}</span>
            </span>
          ))}
        </div>
      )}

      {/* Interactive Quick Indicator Pills */}
      {granularity === "annually" ? (
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 pt-2 px-1">
          {MONTH_NAMES.map((name, i) => {
            const mIdx = i + 1;
            const isInRange =
              minIdx !== null && maxIdx !== null
                ? mIdx >= minIdx && mIdx <= maxIdx
                : resolvedActiveIdx === mIdx;
            const isEdge = minIdx !== null && maxIdx !== null && (mIdx === minIdx || mIdx === maxIdx);

            return (
              <button
                key={name}
                type="button"
                onClick={() => handlePillClick(mIdx)}
                className={cn(
                  "text-[10px] py-1 px-1 rounded text-center font-medium transition-all",
                  isInRange
                    ? isEdge
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-primary/20 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={`Click to select ${name}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      ) : granularity === "weekly" ? (
        <div className="grid grid-cols-7 gap-1 pt-2 px-1">
          {data.map((point) => {
            const isInRange =
              minIdx !== null && maxIdx !== null
                ? point.index >= minIdx && point.index <= maxIdx
                : resolvedActiveIdx === point.index;
            const isEdge = minIdx !== null && maxIdx !== null && (point.index === minIdx || point.index === maxIdx);

            return (
              <button
                key={point.label}
                type="button"
                onClick={() => handlePillClick(point.index)}
                className={cn(
                  "text-[10px] py-1 px-1 rounded text-center font-medium transition-all",
                  isInRange
                    ? isEdge
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-primary/20 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={`Click to select ${point.label}`}
              >
                {point.label}
              </button>
            );
          })}
        </div>
      ) : (
        // Monthly / Custom: Days interval chips or quick range buttons
        <div className="flex flex-wrap items-center justify-between gap-1 pt-2 px-1">
          <span className="text-[10px] text-muted-foreground">
            {data.length} days in period • Click two points or drag graph to filter day range
          </span>
        </div>
      )}

      {/* Range Status & Helper Text */}
      <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-muted-foreground">
        <span>
          {granularity === "annually"
            ? "Click 2 months or drag graph to filter range"
            : "Click 2 points or drag graph to filter dates"}
        </span>

        {hasRange && minIdx !== null && maxIdx !== null ? (
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <span>
              {minIdx === maxIdx
                ? `Active: ${data.find((d) => (d.index ?? d.monthIndex) === minIdx)?.label || minIdx}`
                : `Range: ${data.find((d) => (d.index ?? d.monthIndex) === minIdx)?.label || minIdx} – ${
                    data.find((d) => (d.index ?? d.monthIndex) === maxIdx)?.label || maxIdx
                  }`}
            </span>
            {onClearRange && (
              <button
                type="button"
                onClick={onClearRange}
                className="hover:underline flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-2.5" />
                Clear
              </button>
            )}
          </div>
        ) : resolvedActiveIdx ? (
          <span className="font-medium text-foreground">
            Active: {data.find((d) => (d.index ?? d.monthIndex) === resolvedActiveIdx)?.label || resolvedActiveIdx}
          </span>
        ) : null}
      </div>
    </div>
  );
}


