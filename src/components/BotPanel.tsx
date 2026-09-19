import { useEffect, useRef, useState } from "react";
import { deriv, formatPrice, SYMBOLS, type Tick } from "@/lib/deriv";

type Direction = "rise" | "fall";
type Strategy = "momentum" | "reversion";

type Trade = {
  id: number;
  time: string;
  direction: Direction;
  entry: number;
  exit: number | null;
  stake: number;
  profit: number | null;
  result: "open" | "won" | "lost" | "tie";
};

const PAYOUT = 0.95; // 95% payout on a winning trade

function decide(strategy: Strategy, window: Tick[]): Direction {
  const recent = window.slice(-4);
  const rising = recent.filter((t, i) => i > 0 && t.quote > recent[i - 1]!.quote).length;
  if (strategy === "momentum") return rising >= 2 ? "rise" : "fall";
  return rising >= 2 ? "fall" : "rise";
}

export function BotPanel() {
  const [symbol, setSymbol] = useState<string>(SYMBOLS[4].symbol);
  const [strategy, setStrategy] = useState<Strategy>("momentum");
  const [stake, setStake] = useState(1);
  const [duration, setDuration] = useState(5);
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const runningRef = useRef(false);
  const openTradeRef = useRef<{ direction: Direction; entry: number; ticksLeft: number; id: number } | null>(null);
  const windowRef = useRef<Tick[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    let alive = true;
    windowRef.current = [];
    setTicks([]);
    deriv
      .history(symbol, 100)
      .then((h) => {
        if (!alive) return;
        windowRef.current = h;
        setTicks(h);
      })
      .catch(() => undefined);
    const unsub = deriv.subscribe(symbol, (t) => {
      windowRef.current = [...windowRef.current.slice(-119), t];
      setTicks((prev) => [...prev.slice(-119), t]);

      if (!runningRef.current) return;
      const open = openTradeRef.current;
      if (open) {
        open.ticksLeft -= 1;
        if (open.ticksLeft <= 0) {
          const won = open.direction === "rise" ? t.quote > open.entry : t.quote < open.entry;
          const tie = t.quote === open.entry;
          const profit = tie ? 0 : won ? 0 : 0; // placeholder replaced below
          const pnl = tie ? 0 : won ? 0 : 0;
          void profit;
          void pnl;
          const stakeUsed = tradesStakeRef.current;
          const finalPnl = tie ? 0 : won ? stakeUsed * PAYOUT : -stakeUsed;
          if (won && !tie) setWins((w) => w + 1);
          if (!won && !tie) setLosses((l) => l + 1);
          setTrades((prev) =>
            prev.map((tr) =>
              tr.id === open.id
                ? { ...tr, exit: t.quote, profit: finalPnl, result: tie ? "tie" : won ? "won" : "lost" }
                : tr,
            ),
          );
          openTradeRef.current = null;
        }
      } else {
        const direction = decide(strategyRef.current, windowRef.current);
        const id = ++idRef.current;
        openTradeRef.current = { direction, entry: t.quote, ticksLeft: durationRef.current, id };
        tradesStakeRef.current = stakeRef.current;
        setTrades((prev) => [
          {
            id,
            time: new Date().toLocaleTimeString(),
            direction,
            entry: t.quote,
            exit: null,
            stake: stakeRef.current,
            profit: null,
            result: "open",
          },
          ...prev.slice(0, 19),
        ]);
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [symbol]);

  const strategyRef = useRef(strategy);
  strategyRef.current = strategy;
  const stakeRef = useRef(stake);
  stakeRef.current = stake;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const tradesStakeRef = useRef(stake);

  const start = () => {
    runningRef.current = true;
    setRunning(true);
  };
  const stop = () => {
    runningRef.current = false;
    setRunning(false);
    openTradeRef.current = null;
  };

  const last = ticks[ticks.length - 1];
  const prev = ticks[ticks.length - 2];
  const up = last && prev ? last.quote >= prev.quote : true;
  const totalPnl = trades.reduce((sum, t) => sum + (t.profit ?? 0), 0);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Sentinel Bot</h3>
          <p className="text-sm text-muted-foreground">
            Paper-trades live Deriv synthetic indices. No real money involved.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              running ? "bg-profit/10 text-profit" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`size-1.5 rounded-full ${running ? "bg-profit animate-pulse" : "bg-muted-foreground"}`} />
            {running ? "Running" : "Stopped"}
          </span>
          <button
            onClick={running ? stop : start}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              running
                ? "bg-loss/15 text-loss hover:bg-loss/25"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {running ? "Stop bot" : "Start bot"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Market</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {SYMBOLS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Strategy</span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="momentum">Momentum — ride the trend</option>
              <option value="reversion">Mean reversion — fade the move</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Stake (USD)</span>
              <input
                type="number"
                min={0.35}
                step={0.5}
                value={stake}
                onChange={(e) => setStake(Math.max(0.35, Number(e.target.value) || 0.35))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (ticks)</span>
              <input
                type="number"
                min={1}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
              />
            </label>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-muted-foreground">Live price</p>
            <p className={`mt-1 font-mono text-3xl font-bold tabular-nums ${up ? "text-profit" : "text-loss"}`}>
              {last ? formatPrice(symbol, last.quote) : "—"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/60 py-2">
                <p className="font-mono text-sm font-semibold text-profit">{wins}</p>
                <p className="text-[10px] text-muted-foreground">Wins</p>
              </div>
              <div className="rounded-lg bg-muted/60 py-2">
                <p className="font-mono text-sm font-semibold text-loss">{losses}</p>
                <p className="text-[10px] text-muted-foreground">Losses</p>
              </div>
              <div className="rounded-lg bg-muted/60 py-2">
                <p
                  className={`font-mono text-sm font-semibold ${
                    totalPnl > 0 ? "text-profit" : totalPnl < 0 ? "text-loss" : "text-foreground"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {totalPnl.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">P/L</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Trade log</p>
          <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Direction</th>
                  <th className="px-3 py-2 font-medium">Entry</th>
                  <th className="px-3 py-2 font-medium">Exit</th>
                  <th className="px-3 py-2 font-medium">Stake</th>
                  <th className="px-3 py-2 font-medium">P/L</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center font-sans text-sm text-muted-foreground">
                      Start the bot to begin paper trading on live ticks.
                    </td>
                  </tr>
                )}
                {trades.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="px-3 py-2 text-muted-foreground">{t.time}</td>
                    <td className={`px-3 py-2 font-semibold ${t.direction === "rise" ? "text-profit" : "text-loss"}`}>
                      {t.direction.toUpperCase()}
                    </td>
                    <td className="px-3 py-2 text-foreground">{formatPrice(symbol, t.entry)}</td>
                    <td className="px-3 py-2 text-foreground">{t.exit !== null ? formatPrice(symbol, t.exit) : "…"}</td>
                    <td className="px-3 py-2 text-foreground">${t.stake.toFixed(2)}</td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        t.result === "won"
                          ? "text-profit"
                          : t.result === "lost"
                            ? "text-loss"
                            : "text-muted-foreground"
                      }`}
                    >
                      {t.profit === null ? "OPEN" : `${t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
