import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSessionProfile() {
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
