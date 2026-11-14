import { NextResponse } from "next/server";
import { cancel, checkIn, getReservation, markNoShow } from "@/lib/reservations";
import { isStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  const r = await getReservation(id);
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    if (action === "checkin") await checkIn(r);
    else if (action === "noshow") await markNoShow(r);
    else if (action === "cancel") await cancel(r, "staff");
    else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    return NextResponse.json({ ok: true, status: r.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
