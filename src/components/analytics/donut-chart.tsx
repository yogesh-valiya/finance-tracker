"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryBreakdownItem } from "@/app/api/analytics/categories/route";

interface DonutChartProps {
  data: CategoryBreakdownItem[];
  total: number;
  type?: "EXPENSE" | "INCOME";
  selectedCategoryId?: string | null;
  onSelectCategory?: (categoryId: string) => void;
  onDoubleClickCategory?: (categoryId: string) => void;
}

// Harmonious category color palette
const CATEGORY_COLORS = [
  "#2563eb", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#84cc16", // lime
];

export function DonutChart({
  data,
  total,
  type = "EXPENSE",
  selectedCategoryId,
  onSelectCategory,
  onDoubleClickCategory,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [inspectedId, setInspectedId] = React.useState<string | null>(null);
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      name: item.name,
      emoji: item.emoji,
      value: item.amount,
      percentage: item.percentage,
      id: item.id,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [data]);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleItemClick = (entry: any, index?: number) => {
    const item =
      (entry && entry.id ? entry : entry?.payload) ||
      (typeof index === "number" ? chartData[index] : null);
    if (!item || !item.id) return;

    if (clickTimerRef.current) {
      // Second click within 280ms -> Double-Click to filter!
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setInspectedId(null);
      if (onDoubleClickCategory) {
        onDoubleClickCategory(item.id);
      }
    } else {
      // First click: wait 280ms to see if double click happens
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click: inspect/preview this slice in the center
        setInspectedId((prev) => (prev === item.id ? null : item.id));
        onSelectCategory?.(item.id);
      }, 280);
    }
  };

  React.useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  if (total <= 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 relative">
        <svg className="w-48 h-48" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/40"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground font-medium">No {type.toLowerCase()}s</span>
          <span className="text-sm font-bold text-foreground">₹0.00</span>
        </div>
      </div>
    );
  }

  // Active slice for center display: selected category takes precedence, then inspected, then hover
  const selectedItem = selectedCategoryId ? chartData.find((d) => d.id === selectedCategoryId) : null;
  const inspectedItem = inspectedId ? chartData.find((d) => d.id === inspectedId) : null;
  const hoveredItem = activeIndex !== null ? chartData[activeIndex] : null;
  const centerItem = selectedItem || inspectedItem || hoveredItem;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full h-64 flex items-center justify-center select-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs pointer-events-none">
                      <div className="flex items-center gap-1.5 font-semibold text-popover-foreground mb-1">
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span className="font-bold text-foreground tabular-nums">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
                          {item.percentage}%
                        </span>
                      </div>
                      <span className="text-[9px] text-primary font-medium mt-1 block">
                        Double-click to filter
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={92}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(entry, index) => handleItemClick(entry, index)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedCategoryId === entry.id;
                const isInspected = inspectedId === entry.id;
                const isHovered = activeIndex === index;

                return (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={entry.color}
                    stroke={isSelected ? "var(--foreground)" : isInspected ? "var(--primary)" : "transparent"}
                    strokeWidth={isSelected ? 2.5 : isInspected ? 1.5 : 0}
                    cursor="pointer"
                    opacity={
                      selectedCategoryId
                        ? isSelected
                          ? 1
                          : 0.35
                        : inspectedId
                        ? isInspected
                          ? 1
                          : 0.45
                        : activeIndex === null || isHovered
                        ? 1
                        : 0.65
                    }
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total / Detail Overlay */}
        <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center select-none max-w-[125px] px-1">
          {centerItem ? (
            <>
              <span className="text-[11px] font-semibold text-foreground truncate flex items-center gap-1">
                <span>{centerItem.emoji}</span>
                <span className="truncate">{centerItem.name}</span>
              </span>
              <span className="text-base sm:text-lg font-bold text-foreground tabular-nums tracking-tight">
                {formatCurrency(centerItem.value)}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {centerItem.percentage}%
                {selectedCategoryId === centerItem.id ? (
                  <span className="text-primary font-bold ml-1">• Filtered</span>
                ) : (
                  <span className="text-primary/90 ml-1">• 2-click filter</span>
                )}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                Total {type === "EXPENSE" ? "Spent" : "Income"}
              </span>
              <span className="text-base sm:text-lg font-bold text-foreground tabular-nums tracking-tight">
                {formatCurrency(total)}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {data.length} {data.length === 1 ? "category" : "categories"}
              </span>
            </>
          )}
        </div>
      </div>

      <span className="text-[10px] text-muted-foreground pt-1">
        Click to preview • Double-click slice to filter category
      </span>
    </div>
  );
}

export { CATEGORY_COLORS };
