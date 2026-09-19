import { useEffect, useState } from "react";
import { deriv, formatPrice, SYMBOLS, type Tick } from "@/lib/deriv";

export function TickerTape() {
  const [latest, setLatest] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubs = SYMBOLS.map((s) =>
      deriv.subscribe(s.symbol, (t: Tick) => {
        setLatest((prev) => ({ ...prev, [s.symbol]: t.quote }));
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const items = [...SYMBOLS, ...SYMBOLS];

  return (
    <div className="relative overflow-hidden border-y border-border bg-card/60 py-3">
      <div className="flex w-max animate-ticker gap-10">
        {items.map((s, i) => (
          <span key={`${s.symbol}-${i}`} className="flex items-center gap-2 font-mono text-sm whitespace-nowrap">
            <span className="text-muted-foreground">{s.symbol}</span>
            <span className="font-semibold text-foreground">
              {latest[s.symbol] !== undefined ? formatPrice(s.symbol, latest[s.symbol]!) : "—"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
