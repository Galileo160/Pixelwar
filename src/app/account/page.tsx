import { Gem, Image, Lock, Paintbrush } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { StatCard } from "@/components/StatCard";
import { getSessionProfile } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { supabase, profile } = await getSessionProfile();
  const [{ data: owned }, { count: paintedCount }, { count: lockedCount }] = await Promise.all([
    supabase.from("pixels").select("*").eq("owner_id", profile.id).order("updated_at", { ascending: false }).limit(80),
    supabase.from("pixel_history").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("pixels").select("x", { count: "exact", head: true }).eq("owner_id", profile.id).eq("locked", true)
  ]);

  const unlocked = (owned ?? []).filter((pixel) => !pixel.locked).slice(0, 20);
  const locked = (owned ?? []).filter((pixel) => pixel.locked).slice(0, 20);

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyanNeon">Account</p>
        <h1 className="mt-3 text-4xl font-black">@{profile.username}</h1>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Bemalte Pixel" value={paintedCount ?? 0} icon={<Paintbrush className="text-cyanNeon" />} />
          <StatCard label="Locked Pixel" value={lockedCount ?? 0} icon={<Lock className="text-pinkNeon" />} />
          <StatCard label="Diamonds" value={profile.diamonds} icon={<Gem className="text-cyanNeon" />} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glass-card rounded-3xl p-6">
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><Image /> Vorschau deiner Pixelkunst</h2>
            <div className="grid grid-cols-10 gap-2 sm:grid-cols-16 md:grid-cols-20">
              {(owned ?? []).slice(0, 80).map((pixel) => (
                <div key={`${pixel.x}-${pixel.y}`} className="aspect-square rounded-md border border-white/10" title={`${pixel.x},${pixel.y}`} style={{ background: pixel.color }} />
              ))}
            </div>
            {owned?.length === 0 && <p className="text-slate-400">Noch keine Pixel. Starte auf der Pixel-Wall.</p>}
          </div>

          <div className="space-y-6">
            <PixelList title="Locked Pixel" pixels={locked} />
            <PixelList title="Zuletzt unlocked bemalt" pixels={unlocked} />
          </div>
        </section>
      </main>
    </>
  );
}

function PixelList({ title, pixels }: { title: string; pixels: Array<{ x: number; y: number; color: string; updated_at: string }> }) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 font-black">{title}</h3>
      <div className="space-y-2">
        {pixels.map((pixel) => (
          <div key={`${title}-${pixel.x}-${pixel.y}`} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm">
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: pixel.color }} />({pixel.x}, {pixel.y})</span>
            <span className="text-slate-500">{formatDate(pixel.updated_at)}</span>
          </div>
        ))}
        {pixels.length === 0 && <p className="text-sm text-slate-500">Keine Einträge.</p>}
      </div>
    </div>
  );
}
