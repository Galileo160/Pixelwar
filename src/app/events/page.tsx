import { CalendarDays, Flag, Sparkles } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { getSessionProfile } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { supabase, profile } = await getSessionProfile();
  const { data: events } = await supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(10);
  const active = events?.find((event) => event.active);

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-limeNeon">Events Vorbereitung</p>
        <h1 className="mt-3 text-4xl font-black">Challenges & Community-Ziele</h1>
        <section className="mt-8 glass-card rounded-3xl p-8">
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-limeNeon p-4 text-void"><Sparkles /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-limeNeon">Aktive Challenge</p>
              <h2 className="mt-2 text-3xl font-black">{active?.title ?? "Baue das grösste Pixelkunstwerk der Woche"}</h2>
              <p className="mt-3 max-w-3xl text-slate-300">{active?.description ?? "Platzhalter-Event für das MVP: Teams und Einzelspieler sollen zusammenhängende Pixelkunst planen, koordinieren und sichtbar machen."}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                <span className="rounded-full bg-white/10 px-4 py-2"><CalendarDays size={15} className="mr-1 inline" />{active ? `${formatDate(active.starts_at)} – ${formatDate(active.ends_at)}` : "Demo-Zeitraum"}</span>
                <span className="rounded-full bg-white/10 px-4 py-2"><Flag size={15} className="mr-1 inline" />Scoring kommt später</span>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {(events ?? []).map((event) => (
            <article key={event.id} className="glass-card rounded-3xl p-6">
              <p className="text-sm text-cyanNeon">{event.active ? "Aktiv" : "Geplant/Archiv"}</p>
              <h3 className="mt-2 text-xl font-black">{event.title}</h3>
              <p className="mt-2 text-slate-400">{event.description}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
