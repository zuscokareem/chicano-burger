import { NextResponse } from "next/server";
import { isStaff } from "@/lib/staff";
import { store } from "@/lib/store";
import { isValidDate, nowLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("date") ?? "";
  const date = isValidDate(q) ? q : nowLocal().date;
  const rows = (await store.listDay(date))
    .filter((r) => r.status !== "expired")
    .sort((a, b) => a.time.localeCompare(b.time) || a.createdAt - b.createdAt)
    .map((r) => ({ ...r, token: undefined })); // never send guest tokens to the browser
  return NextResponse.json({ date, now: Date.now(), reservations: rows });
}
