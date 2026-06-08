import Link from "next/link";
import { Coins, Gem, Grid3X3, Trophy } from "lucide-react";
import type { Profile } from "@/types/database";
import { formatCoins } from "@/lib/utils";

const links = [
  ["Wall", "/wall"],
  ["Account", "/account"],
  ["Börse", "/market"],
  ["Rankings", "/leaderboards"],
  ["Events", "/events"]
];

export function TopNav({ profile }: { profile?: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyanNeon text-void"><Grid3X3 size={18} /></span>
          Pixelwar
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
          {links.map(([label, href]) => (
            <Link key={href} className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href={href}>{label}</Link>
          ))}
        </nav>
        {profile ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-2">@{profile.username}</span>
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/10 px-3 py-2 text-yellow-200"><Coins size={16} />{formatCoins(profile.coins)}</span>
            <span className="flex items-center gap-1 rounded-full bg-cyan-400/10 px-3 py-2 text-cyan-200"><Gem size={16} />{formatCoins(profile.diamonds)}</span>
          </div>
        ) : (
          <Link className="rounded-full bg-cyanNeon px-4 py-2 font-bold text-void" href="/login"><Trophy size={16} className="mr-1 inline" />Login</Link>
        )}
      </div>
    </header>
  );
}
