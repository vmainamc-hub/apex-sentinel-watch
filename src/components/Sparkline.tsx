import { useMemo } from "react";
import type { Tick } from "@/lib/deriv";

export function Sparkline({
  ticks,
  width = 120,
  height = 36,
  positive,
}: {
  ticks: Tick[];
  width?: number;
  height?: number;
  positive: boolean;
}) {
  const path = useMemo(() => {
    if (ticks.length < 2) return "";
    const quotes = ticks.map((t) => t.quote);
    const min = Math.min(...quotes);
    const max = Math.max(...quotes);
    const range = max - min || 1;
    return quotes
      .map((q, i) => {
        const x = (i / (quotes.length - 1)) * width;
        const y = height - ((q - min) / range) * (height - 2) - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [ticks, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        className={positive ? "stroke-profit" : "stroke-loss"}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
