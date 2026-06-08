import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionProfile(): Promise<{ supabase: ReturnType<typeof createClient>; user: { id: string }; profile: Profile }> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    redirect("/login");
    throw new Error("Unauthenticated");
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data;
  if (error || !profile) {
    redirect("/login");
    throw new Error("Profile not found");
  }

  return { supabase, user, profile };
}
