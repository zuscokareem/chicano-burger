import { NextResponse } from "next/server";
import { sweepNoShows } from "@/lib/reservations";
import { addDays, nowLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Runs nightly after closing (see vercel.json). Any confirmed reservation that was never
 * checked in and is past its 15-minute grace period becomes a no-show: 50% of the deposit
 * is kept and 50% refunded. Staff can also do this by hand from /staff during service.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.AUTO_NO_SHOW === "false") return NextResponse.json({ skipped: true });
  const today = nowLocal().date;
  const processed = await sweepNoShows([addDays(today, -1), today]);
  return NextResponse.json({ processed });
}
