export type Tick = { epoch: number; quote: number };

export const SYMBOLS = [
  { symbol: "R_10", name: "Volatility 10" },
  { symbol: "R_25", name: "Volatility 25" },
  { symbol: "R_50", name: "Volatility 50" },
  { symbol: "R_75", name: "Volatility 75" },
  { symbol: "R_100", name: "Volatility 100" },
  { symbol: "1HZ100V", name: "Volatility 100 (1s)" },
] as const;

type TickHandler = (tick: Tick) => void;

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

/**
 * Minimal Deriv WebSocket API client (browser only).
 * Uses the public demo app id for unauthenticated market data.
 */
class DerivClient {
  private ws: WebSocket | null = null;
  private opening: Promise<void> | null = null;
  private reqId = 0;
  private pending = new Map<number, Pending>();
  private handlers = new Map<string, Set<TickHandler>>();

  private connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.opening) return this.opening;

    this.opening = new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
      this.ws = ws;
      ws.onopen = () => {
        this.opening = null;
        // resubscribe existing symbols after reconnect
        for (const symbol of this.handlers.keys()) {
          this.send({ ticks: symbol, subscribe: 1 });
        }
        resolve();
      };
      ws.onerror = () => {
        this.opening = null;
        reject(new Error("WebSocket connection failed"));
      };
      ws.onclose = () => {
        this.ws = null;
        this.opening = null;
        if (this.handlers.size > 0) {
          setTimeout(() => void this.connect().catch(() => undefined), 2000);
        }
      };
      ws.onmessage = (event) => this.onMessage(event);
    });
    return this.opening;
  }

  private onMessage(event: MessageEvent) {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(String(event.data));
    } catch {
      return;
    }
    const reqId = data.req_id as number | undefined;
    if (reqId !== undefined && this.pending.has(reqId)) {
      const p = this.pending.get(reqId)!;
      this.pending.delete(reqId);
      if (data.error) {
        p.reject(new Error((data.error as { message?: string }).message ?? "API error"));
      } else {
        p.resolve(data);
      }
    }
    if (data.msg_type === "tick") {
      const tick = data.tick as { symbol: string; epoch: number; quote: number };
      const set = this.handlers.get(tick.symbol);
      if (set) {
        for (const h of set) h({ epoch: tick.epoch, quote: tick.quote });
      }
    }
  }

  private send(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("Socket not open"));
        return;
      }
      const id = ++this.reqId;
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.ws.send(JSON.stringify({ ...payload, req_id: id }));
    });
  }

  async history(symbol: string, count = 100): Promise<Tick[]> {
    await this.connect();
    const res = await this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      end: "latest",
      start: 1,
      style: "ticks",
    });
    const history = res.history as { prices: number[]; times: number[] };
    return history.times.map((t, i) => ({ epoch: t, quote: history.prices[i] }));
  }

  subscribe(symbol: string, handler: TickHandler): () => void {
    let set = this.handlers.get(symbol);
    if (!set) {
      set = new Set();
      this.handlers.set(symbol, set);
    }
    set.add(handler);
    void this.connect()
      .then(() => this.send({ ticks: symbol, subscribe: 1 }))
      .catch(() => undefined);

    return () => {
      const s = this.handlers.get(symbol);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
        this.handlers.delete(symbol);
        void this.send({ forget_all: "ticks" }).catch(() => undefined);
        for (const sym of this.handlers.keys()) {
          void this.send({ ticks: sym, subscribe: 1 }).catch(() => undefined);
        }
      }
    };
  }
}

export const deriv = new DerivClient();

export function formatPrice(symbol: string, quote: number): string {
  const decimals = symbol === "R_10" || symbol === "R_25" ? 3 : symbol.startsWith("1HZ") ? 2 : 2;
  return quote.toFixed(decimals);
}
