import { createFileRoute } from "@tanstack/react-router";
import { BotPanel } from "@/components/BotPanel";
import { MarketCard } from "@/components/MarketCard";
import { TickerTape } from "@/components/TickerTape";
import { SYMBOLS } from "@/lib/deriv";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apex Sentinel — Automated Trading Bot for Deriv" },
      {
        name: "description",
        content:
          "Apex Sentinel is an automated trading bot for Deriv synthetic indices. Watch live markets, configure a strategy, and paper-trade on real-time ticks.",
      },
      { property: "og:title", content: "Apex Sentinel — Automated Trading Bot for Deriv" },
      {
        property: "og:description",
        content:
          "Watch live Deriv markets, configure a strategy, and let the Sentinel bot paper-trade on real-time ticks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
              AS
            </span>
            <span className="text-lg font-bold tracking-tight">Apex Sentinel</span>
          </div>
          <a
            href="#bot"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Launch bot
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={hero}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 text-center">
          <p className="mb-4 inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
            Live on Deriv synthetic indices
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Automated trading, watched by the Sentinel
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Stream real-time market data, pick a strategy, and let the bot execute tick trades for you — risk-free in
            paper-trading mode.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#bot"
              className="rounded-xl bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              Start paper trading
            </a>
            <a
              href="#markets"
              className="rounded-xl border border-border bg-card px-7 py-3 text-base font-semibold text-foreground transition-colors hover:border-primary/40"
            >
              View live markets
            </a>
          </div>
        </div>
      </section>

      <TickerTape />

      <section id="markets" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Live markets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time prices streamed over the Deriv WebSocket API.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYMBOLS.map((s) => (
            <MarketCard key={s.symbol} symbol={s.symbol} name={s.name} />
          ))}
        </div>
      </section>

      <section id="bot" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-bold tracking-tight">Trading bot</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Choose a market and strategy, set your stake, and start the bot. Trades are simulated against live ticks.
        </p>
        <BotPanel />
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Apex Sentinel</p>
          <p className="mt-2 max-w-2xl mx-auto">
            Trading involves substantial risk of loss. This app paper-trades on live Deriv synthetic indices for
            demonstration only — no real funds are used. Past performance never guarantees future results.
          </p>
        </div>
      </footer>
    </div>
  );
}
