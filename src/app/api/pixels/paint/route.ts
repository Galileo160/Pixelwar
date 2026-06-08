import { NextResponse } from "next/server";
import { paintPixelSchema, requireUser } from "@/lib/api";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = paintPixelSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data, error } = await (auth.supabase as any).rpc("paint_pixel", {
    p_x: body.data.x,
    p_y: body.data.y,
    p_color: body.data.color,
    p_lock: body.data.lock
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
