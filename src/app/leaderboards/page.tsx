import type { ReactNode } from "react";
import { Crown, Gem, Paintbrush, PiggyBank, TrendingUp, Zap } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { getSessionProfile } from "@/lib/data";
import { formatCoins } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardsPage() {
  const { supabase, profile } = await getSessionProfile();
  const [{ data: profiles }, { data: lockedPixels }, { data: history }, { data: holdings }, { data: assets }] = await Promise.all([
    supabase.from("profiles").select("id, username, coins").order("coins", { ascending: false }).limit(20),
    supabase.from("pixels").select("owner_id, locked").eq("locked", true).not("owner_id", "is", null),
    supabase.from("pixel_history").select("user_id"),
    supabase.from("user_asset_holdings").select("user_id, asset_id, quantity"),
    supabase.from("virtual_assets").select("id, current_price")
  ]);

  const usernames = new Map((profiles ?? []).map((item) => [item.id, item.username]));
  const prices = new Map((assets ?? []).map((item) => [item.id, item.current_price]));
  const lockedRank = rankCounts(lockedPixels?.map((item) => item.owner_id ?? "") ?? [], usernames);
  const paintedRank = rankCounts(history?.map((item) => item.user_id ?? "") ?? [], usernames);
  const portfolioRank = Array.from(
    (holdings ?? []).reduce((map, holding) => map.set(holding.user_id, (map.get(holding.user_id) ?? 0) + holding.quantity * (prices.get(holding.asset_id) ?? 0)), new Map<string, number>())
  ).map(([id, value]) => ({ id, label: usernames.get(id) ?? id.slice(0, 8), value })).sort((a, b) => b.value - a.value).slice(0, 10);

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyanNeon">Leaderboards</p>
        <h1 className="mt-3 text-4xl font-black">Wer dominiert die Wall?</h1>
        <section className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <Board title="Meiste locked Pixel" icon={<Gem />} rows={lockedRank} />
          <Board title="Meiste bemalte Pixel" icon={<Paintbrush />} rows={paintedRank} />
          <Board title="Reichste Nutzer nach Coins" icon={<PiggyBank />} rows={(profiles ?? []).map((item) => ({ id: item.id, label: item.username, value: item.coins }))} coins />
          <Board title="Höchster Börsenwert" icon={<TrendingUp />} rows={portfolioRank} coins />
          <Board title="Aktivste Nutzer" icon={<Zap />} rows={paintedRank} />
        </section>
      </main>
    </>
  );
}

function rankCounts(ids: string[], usernames: Map<string, string>) {
  return Array.from(ids.filter(Boolean).reduce((map, id) => map.set(id, (map.get(id) ?? 0) + 1), new Map<string, number>()))
    .map(([id, value]) => ({ id, label: usernames.get(id) ?? id.slice(0, 8), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function Board({ title, icon, rows, coins = false }: { title: string; icon: ReactNode; rows: Array<{ id: string; label: string; value: number }>; coins?: boolean }) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-white"><span className="text-pinkNeon">{icon}</span>{title}</h2>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${title}-${row.id}`} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
            <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10"><Crown size={15} className={index === 0 ? "text-yellow-300" : "text-slate-500"} /></span>@{row.label}</span>
            <strong>{coins ? formatCoins(row.value) : row.value}</strong>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">Noch keine Daten.</p>}
      </div>
    </div>
  );
}
