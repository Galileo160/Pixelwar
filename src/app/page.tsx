import Link from "next/link";
import { Brush, Coins, Gem, Lock, RadioTower, Trophy } from "lucide-react";
import { TopNav } from "@/components/TopNav";

const features = [
  [Brush, "1’000’000 Pixel", "Eine 1000 × 1000 Canvas als live bespielbare digitale Leinwand."],
  [Coins, "Coins Economy", "Färben, Übermalen und virtuelle Assets handeln – ohne Echtgeldwert."],
  [Gem, "Diamonds & Locks", "Sperre Pixel dauerhaft und baue geschützte Pixelkunstwerke."],
  [RadioTower, "Realtime Chaos", "Supabase Realtime vorbereitet für kollaboratives Kunst-Chaos."],
  [Trophy, "Rankings", "Leaderboards für Aktivität, Besitz, Wealth und Portfolio-Wert."],
  [Lock, "Sichere Aktionen", "Server-APIs und RPCs statt manipulierbarer Client-Wallets."]
];

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyanNeon/30 bg-cyanNeon/10 px-4 py-2 text-sm font-semibold text-cyanNeon">Creative tech game · keine Werbungstafel</p>
            <h1 className="text-5xl font-black tracking-tight md:text-7xl">Baue, besetze und verteidige deine Pixel-Zone.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Pixelwar ist eine futuristische Pixel-Wall, in der Kunst, Chaos und Strategie kollidieren: Farbe setzen, Pixel besitzen, wertvolle Zonen sichern und mit virtuellen Ingame-Assets experimentieren.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login" className="rounded-2xl bg-gradient-to-r from-cyanNeon to-pinkNeon px-6 py-4 font-black text-void shadow-glow">Login / Start</Link>
              <Link href="/wall" className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 font-bold text-white">Canvas ansehen</Link>
            </div>
          </div>
          <div className="glass-card relative overflow-hidden rounded-[2rem] p-4">
            <div className="grid aspect-square grid-cols-12 gap-1 rounded-3xl bg-white p-3 pixelated">
              {Array.from({ length: 144 }).map((_, index) => (
                <div key={index} className="rounded-[2px]" style={{ background: ["#35f7ff", "#ff4fd8", "#b5ff4d", "#ffffff", "#111827"][(index * 7 + Math.floor(index / 12)) % 5] }} />
              ))}
            </div>
            <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-void/80 p-5 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.35em] text-pinkNeon">MVP Ready</p>
              <p className="mt-2 text-2xl font-black">Pixel, Locks, Coins, Diamonds, Börse & Events</p>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, text]) => (
            <div key={String(title)} className="glass-card rounded-3xl p-6">
              <Icon className="mb-5 text-cyanNeon" />
              <h2 className="text-xl font-black">{String(title)}</h2>
              <p className="mt-2 text-slate-400">{String(text)}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
