import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { stripeLive } from "./stripe";

export const STAFF_COOKIE = "cb_staff";

/** Demo password only works while no live Stripe key is set. */
export const DEMO_STAFF_PASSWORD = "chicano-demo";

export function staffPassword(): string | null {
  if (process.env.STAFF_PASSWORD) return process.env.STAFF_PASSWORD;
  return stripeLive ? null : DEMO_STAFF_PASSWORD;
}

const hash = (s: string) => createHash("sha256").update(`chicano-staff:${s}`).digest("hex");

export function staffCookieValue() {
  const pw = staffPassword();
  return pw ? hash(pw) : null;
}

export function passwordMatches(input: string) {
  const pw = staffPassword();
  if (!pw) return false;
  const a = Buffer.from(hash(input));
  const b = Buffer.from(hash(pw));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isStaff() {
  const expected = staffCookieValue();
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(STAFF_COOKIE)?.value === expected;
}
