import { useEffect, useState } from "react";
import { deriv, formatPrice, type Tick } from "@/lib/deriv";
import { Sparkline } from "./Sparkline";

export function MarketCard({ symbol, name }: { symbol: string; name: string }) {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    let alive = true;
    deriv
      .history(symbol, 60)
      .then((h) => {
        if (alive) setTicks(h);
      })
      .catch(() => undefined);
    const unsub = deriv.subscribe(symbol, (t) => {
      setTicks((prev) => [...prev.slice(-59), t]);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [symbol]);

  const last = ticks[ticks.length - 1];
  const first = ticks[0];
  const change = last && first ? ((last.quote - first.quote) / first.quote) * 100 : 0;
  const positive = change >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-card-foreground">{name}</p>
          <p className="font-mono text-xs text-muted-foreground">{symbol}</p>
        </div>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${
            positive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
          }`}
        >
          {positive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="font-mono text-xl font-semibold tabular-nums text-card-foreground">
          {last ? formatPrice(symbol, last.quote) : "—"}
        </p>
        <Sparkline ticks={ticks} positive={positive} />
      </div>
    </div>
  );
}
