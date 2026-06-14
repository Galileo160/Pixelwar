"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/wall`;

      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

      const result =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { username } } })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Account erstellt. Bitte bestätige deine E-Mail, falls Supabase Email-Confirm aktiviert ist.");
        return;
      }

      window.location.href = "/wall";
    } catch (error) {
      console.error("Auth request failed:", error);
      setMessage(error instanceof Error ? error.message : "Auth request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card mx-auto max-w-md rounded-3xl p-6">
      <div className="mb-6 flex rounded-2xl bg-white/5 p-1">
        {["login", "signup"].map((item) => (
          <button
            key={item}
            onClick={() => setMode(item as "login" | "signup")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${mode === item ? "bg-cyanNeon text-void" : "text-slate-300"}`}
          >
            {item === "login" ? "Login" : "Registrieren"}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {mode === "signup" && <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />}
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
        <button
          onClick={submit}
          disabled={loading || !email || !password || (mode === "signup" && !username)}
          className="w-full rounded-xl bg-gradient-to-r from-cyanNeon to-pinkNeon px-5 py-3 font-bold text-void disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Bitte warten..." : mode === "login" ? "Starten" : "Account erstellen"}
        </button>
        {message && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</p>}
      </div>
    </div>
  );
}
