import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase.rpc("claim_rewarded_ad_demo");
  if (error) return NextResponse.json({ error: error.message }, { status: 429 });
  return NextResponse.json(data);
}
