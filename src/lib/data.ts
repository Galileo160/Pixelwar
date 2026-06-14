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
  let profile = data as Profile | null;

  if (error || !profile) {
    const username =
      typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim()
        ? user.user_metadata.username.trim()
        : user.email?.split("@")[0] ?? "Player";

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        coins: 100,
        diamonds: 0
      })
      .select("*")
      .single();

    if (createError || !createdProfile) {
      redirect("/login");
      throw new Error("Profile not found");
    }

    profile = createdProfile as Profile;
  }

  return { supabase, user, profile };
}
