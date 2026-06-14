import { NextResponse } from "next/server";
import { z } from "zod";
import { IS_TEST_MODE } from "@/lib/config";
import { requireUser } from "@/lib/api";

const schema = z.object({ coins: z.number().int().min(0).max(100), diamonds: z.number().int().min(0).max(10) });

export async function POST(request: Request) {
  if (!IS_TEST_MODE) return NextResponse.json({ error: "Nur im Dev/Testmodus verfügbar" }, { status: 403 });
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data, error } = await auth.supabase.rpc("grant_test_currency", { p_coins: body.data.coins, p_diamonds: body.data.diamonds });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
