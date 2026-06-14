import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidHexColor } from "@/lib/config";

export const paintPixelSchema = z.object({
  x: z.number().int().min(0).max(999),
  y: z.number().int().min(0).max(999),
  color: z.string().refine(isValidHexColor, "Ungültige Farbe"),
  lock: z.boolean().default(false)
});

export const reportSchema = z.object({
  x: z.number().int().min(0).max(999),
  y: z.number().int().min(0).max(999),
  reason: z.string().trim().min(5).max(500)
});

export const tradeSchema = z.object({
  assetId: z.string().uuid(),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().int().min(1).max(1000)
});

export async function requireUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 }) };
  }
  return { supabase, user: data.user };
}
