import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

type ServerClient = ReturnType<typeof createClient>;
type AuthUser = Awaited<ReturnType<ServerClient["auth"]["getUser"]>>["data"]["user"];

export type SessionProfile = {
  supabase: ServerClient;
  user: NonNullable<AuthUser>;
  profile: Profile;
};

export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    redirect("/login");
    throw new Error("Unauthenticated");
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (error || !profile) {
    redirect("/login");
    throw new Error("Profile not found");
  }

  return { supabase, user, profile };
}
