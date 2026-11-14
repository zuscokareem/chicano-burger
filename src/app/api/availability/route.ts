import { NextResponse } from "next/server";
import { availability } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const slots = await availability(date);
  return NextResponse.json({ date, slots }, { headers: { "Cache-Control": "no-store" } });
}
