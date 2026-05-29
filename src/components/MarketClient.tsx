"use client";

import { useState } from "react";
import type { Holding, VirtualAsset } from "@/types/database";
import { formatCoins } from "@/lib/utils";

type AssetWithHistory = VirtualAsset & { asset_price_history?: Array<{ price: number; recorded_at: string }> };

export function MarketClient({ assets, holdings }: { assets: AssetWithHistory[]; holdings: Holding[] }) {
  const [quantity, setQuantity] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const holdingByAsset = new Map(holdings.map((holding) => [holding.asset_id, holding]));

  async function trade(assetId: string, side: "buy" | "sell") {
    const response = await fetch("/api/assets/trade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assetId, side, quantity: quantity[assetId] ?? 1 })
    });
    const payload = await response.json();
    setMessage(response.ok ? "Trade ausgeführt. Seite neu laden, um Portfolio zu aktualisieren." : payload.error ?? "Trade fehlgeschlagen.");
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-yellow-100">Dies ist nur eine virtuelle Spielsimulation. Coins haben keinen Echtgeldwert und können nicht ausgezahlt werden.</p>
      {message && <p className="rounded-2xl bg-white/10 p-4 text-slate-200">{message}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {assets.map((asset) => {
          const holding = holdingByAsset.get(asset.id);
          const history = asset.asset_price_history ?? [];
          const min = Math.min(...history.map((item) => item.price), asset.current_price);
          const max = Math.max(...history.map((item) => item.price), asset.current_price);
          return (
            <article key={asset.id} className="glass-card rounded-3xl p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-cyanNeon">{asset.symbol}</p>
                  <h2 className="mt-2 text-2xl font-black">{asset.name}</h2>
                  <p className="mt-2 text-slate-400">{asset.description}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                  <p className="text-xs text-slate-400">Preis</p>
                  <p className="text-xl font-black">{formatCoins(asset.current_price)}</p>
                </div>
              </div>

              <div className="mb-5 flex h-20 items-end gap-1 rounded-2xl bg-void/60 p-3">
                {history.slice().reverse().map((point, index) => (
                  <div key={`${asset.id}-${point.recorded_at}`} className="flex-1 rounded-t bg-gradient-to-t from-cyanNeon to-pinkNeon" style={{ height: `${20 + ((point.price - min) / Math.max(1, max - min)) * 80}%`, opacity: 0.45 + index / Math.max(1, history.length) }} />
                ))}
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3 rounded-2xl bg-white/5 p-3 text-sm">
                <div><p className="text-slate-500">Gehalten</p><p className="font-bold">{holding?.quantity ?? 0}</p></div>
                <div><p className="text-slate-500">Kaufpreis Ø</p><p className="font-bold">{formatCoins(holding?.avg_buy_price ?? 0)}</p></div>
                <div><p className="text-slate-500">Wert</p><p className="font-bold">{formatCoins((holding?.quantity ?? 0) * asset.current_price)}</p></div>
              </div>

              <div className="flex gap-2">
                <input type="number" min={1} max={1000} value={quantity[asset.id] ?? 1} onChange={(event) => setQuantity((current) => ({ ...current, [asset.id]: Number(event.target.value) }))} className="w-24" />
                <button onClick={() => trade(asset.id, "buy")} className="flex-1 rounded-xl bg-cyanNeon px-4 py-3 font-bold text-void">Kaufen</button>
                <button onClick={() => trade(asset.id, "sell")} className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-bold">Verkaufen</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
