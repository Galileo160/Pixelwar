import { NextResponse } from "next/server";
import { requireUser, tradeSchema } from "@/lib/api";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = tradeSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data, error } = await auth.supabase.rpc("trade_virtual_asset", {
    p_asset_id: body.data.assetId,
    p_side: body.data.side,
    p_quantity: body.data.quantity
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
