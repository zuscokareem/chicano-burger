import { NextResponse } from "next/server";
import { cancel, getReservation } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  const r = await getReservation(id);
  if (!r || !token || token !== r.token) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  try {
    const updated = await cancel(r, "guest");
    return NextResponse.json({ status: updated.status, refundedMXN: updated.refundedMXN ?? 0, keptMXN: updated.keptMXN ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
