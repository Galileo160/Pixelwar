import { AuthPanel } from "@/components/AuthPanel";
import { TopNav } from "@/components/TopNav";

export default function LoginPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyanNeon">Supabase Auth</p>
          <h1 className="mt-3 text-4xl font-black">Einloggen und Pixel setzen</h1>
          <p className="mt-3 text-slate-400">Neue Nutzer erhalten automatisch 100 Coins und 0 Diamonds über den Datenbank-Trigger.</p>
        </div>
        <AuthPanel />
      </main>
    </>
  );
}
