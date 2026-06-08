import { NextResponse } from "next/server";
import { reportSchema, requireUser } from "@/lib/api";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = reportSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { error } = await auth.supabase.from("reports").insert({
    x: body.data.x,
    y: body.data.y,
    reason: body.data.reason,
    reporter_id: auth.user.id
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
