import { TopNav } from "@/components/TopNav";
import { MarketClient } from "@/components/MarketClient";
import { getSessionProfile } from "@/lib/data";
import type { Holding, VirtualAsset } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const { supabase, profile } = await getSessionProfile();
  const [{ data: assets }, { data: holdings }] = await Promise.all([
    supabase.from("virtual_assets").select("*, asset_price_history(price, recorded_at)").order("symbol"),
    supabase.from("user_asset_holdings").select("*").eq("user_id", profile.id)
  ]);

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-pinkNeon">Virtuelle Börse</p>
        <h1 className="mt-3 text-4xl font-black">Ingame-Aktien & Zone-Indizes</h1>
        <p className="mb-8 mt-3 max-w-3xl text-slate-400">Investiere Coins in rein virtuelle Assets wie Center Zone, North Zone, Pixel Art Index und Chaos Index. Die Preisbewegungen werden durch Datenbank-Jobs/RPCs simuliert.</p>
        <MarketClient assets={(assets ?? []) as Array<VirtualAsset & { asset_price_history?: Array<{ price: number; recorded_at: string }> }>} holdings={(holdings ?? []) as Holding[]} />
      </main>
    </>
  );
}
