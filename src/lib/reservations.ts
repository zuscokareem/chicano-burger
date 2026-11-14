import { randomBytes } from "crypto";
import { BOOKING, RESTAURANT } from "./config";
import { store, type Reservation } from "./store";
import { stripe, toCents } from "./stripe";
import { isValidDate, localToEpoch, slotsFor } from "./time";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code(len: number) {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

export const depositFor = (partySize: number) => partySize * BOOKING.depositPerGuestMXN;

/** Does this reservation currently take seats? */
function holdsSeats(r: Reservation, now: number) {
  if (r.status === "confirmed" || r.status === "arrived") return true;
  if (r.status === "pending") return now - r.createdAt < BOOKING.pendingHoldMinutes * 60_000;
  return false;
}

export async function availability(date: string, now = Date.now()) {
  if (!isValidDate(date)) return [];
  const times = slotsFor(date, now);
  if (!times.length) return [];
  const day = await store.listDay(date);
  return times.map((time) => {
    const taken = day
      .filter((r) => r.time === time && holdsSeats(r, now))
      .reduce((sum, r) => sum + r.partySize, 0);
    return { time, seatsLeft: Math.max(0, BOOKING.seatsPerSlot - taken) };
  });
}

export type NewReservation = {
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  lang: "en" | "es";
};

export function validate(input: Partial<NewReservation>): string | null {
  if (!input.date || !isValidDate(input.date)) return "Pick a date.";
  if (!input.time || !/^\d{2}:\d{2}$/.test(input.time)) return "Pick a time.";
  const p = Number(input.partySize);
  if (!Number.isInteger(p) || p < 1 || p > BOOKING.maxPartySize) return "Party size is not valid.";
  if (!input.name || input.name.trim().length < 2) return "Add your name.";
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Add a valid email.";
  if (!input.phone || input.phone.replace(/\D/g, "").length < 8) return "Add a phone or WhatsApp number.";
  return null;
}

export async function createReservation(input: NewReservation, now = Date.now()) {
  const slots = await availability(input.date, now);
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) return { error: "That time is not available any more." as const };
  if (slot.seatsLeft < input.partySize) return { error: "Not enough seats left at that time." as const };

  const r: Reservation = {
    id: `CB-${code(5)}`,
    token: randomBytes(18).toString("base64url"),
    date: input.date,
    time: input.time,
    partySize: input.partySize,
    name: input.name.trim().slice(0, 80),
    email: input.email.trim().toLowerCase().slice(0, 120),
    phone: input.phone.trim().slice(0, 30),
    notes: (input.notes ?? "").trim().slice(0, 300),
    lang: input.lang,
    depositMXN: depositFor(input.partySize),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    demo: !stripe,
    history: [{ at: now, event: "Created, waiting for deposit" }],
  };
  await store.put(r);
  return { reservation: r };
}

export async function getReservation(id: string) {
  return store.get(id);
}

async function save(r: Reservation, event: string) {
  r.updatedAt = Date.now();
  r.history.push({ at: r.updatedAt, event });
  await store.put(r);
  return r;
}

/** Mark a pending reservation as paid (from the Stripe webhook, the success page, or demo mode). */
export async function markPaid(r: Reservation, paymentIntentId?: string) {
  if (r.status !== "pending" && r.status !== "expired") return r;
  r.status = "confirmed";
  if (paymentIntentId) r.paymentIntentId = paymentIntentId;
  return save(r, `Deposit paid (MX$${r.depositMXN}), table confirmed`);
}

/** Refund part of the deposit through Stripe. Returns the refunded amount in MXN. */
async function refund(r: Reservation, amountMXN: number) {
  if (amountMXN <= 0) return 0;
  if (r.demo || !stripe || !r.paymentIntentId) return amountMXN; // demo: nothing to refund
  await stripe.refunds.create(
    { payment_intent: r.paymentIntentId, amount: toCents(amountMXN), reason: "requested_by_customer" },
    { idempotencyKey: `refund-${r.id}-${r.status}-${amountMXN}` },
  );
  return amountMXN;
}

export const startsAt = (r: Reservation) => localToEpoch(r.date, r.time);
export const noShowAt = (r: Reservation) => startsAt(r) + BOOKING.graceMinutes * 60_000;

export async function checkIn(r: Reservation) {
  if (r.status !== "confirmed" && r.status !== "no_show") throw new Error(`Can't check in a ${r.status} reservation.`);
  if (r.status === "no_show") throw new Error("Already marked as no-show and partly refunded.");
  r.status = "arrived";
  return save(r, `Guest arrived. MX$${r.depositMXN} deposit credited to the bill`);
}

/** No-show: keep 50% of the deposit, refund the rest. Only allowed after the grace period. */
export async function markNoShow(r: Reservation, now = Date.now(), by = "staff") {
  if (r.status !== "confirmed") throw new Error(`Can't mark a ${r.status} reservation as no-show.`);
  if (now < noShowAt(r)) throw new Error(`The ${BOOKING.graceMinutes}-minute grace period hasn't passed yet.`);
  const kept = Math.round(r.depositMXN * BOOKING.noShowKeepShare);
  const refunded = await refund(r, r.depositMXN - kept);
  r.status = "no_show";
  r.keptMXN = kept;
  r.refundedMXN = refunded;
  return save(r, `No-show (${by}): kept MX$${kept}, refunded MX$${refunded}`);
}

/** Guest or staff cancellation. Full refund if early enough (or by staff), otherwise treated like a no-show. */
export async function cancel(r: Reservation, by: "guest" | "staff", now = Date.now()) {
  if (r.status === "pending") {
    r.status = "cancelled";
    if (r.stripeSessionId && stripe) {
      await stripe.checkout.sessions.expire(r.stripeSessionId).catch(() => {});
    }
    return save(r, `Cancelled by ${by} before paying`);
  }
  if (r.status !== "confirmed") throw new Error(`Can't cancel a ${r.status} reservation.`);
  const early = startsAt(r) - now >= BOOKING.freeCancelHours * 3600_000;
  const kept = by === "staff" || early ? 0 : Math.round(r.depositMXN * BOOKING.noShowKeepShare);
  const refunded = await refund(r, r.depositMXN - kept);
  r.status = "cancelled";
  r.keptMXN = kept;
  r.refundedMXN = refunded;
  return save(r, `Cancelled by ${by}: refunded MX$${refunded}${kept ? `, kept MX$${kept} (late cancellation)` : ""}`);
}

/** Guest-facing cancellation terms right now. */
export function cancelTerms(r: Reservation, now = Date.now()) {
  const early = startsAt(r) - now >= BOOKING.freeCancelHours * 3600_000;
  const kept = early ? 0 : Math.round(r.depositMXN * BOOKING.noShowKeepShare);
  return { early, kept, refund: r.depositMXN - kept };
}

/** Auto no-show sweep: every confirmed reservation past its grace period on these dates. */
export async function sweepNoShows(dates: string[], now = Date.now()) {
  const done: string[] = [];
  for (const date of dates) {
    for (const r of await store.listDay(date)) {
      if (r.status === "confirmed" && now >= noShowAt(r)) {
        await markNoShow(r, now, "automatic");
        done.push(r.id);
      }
    }
  }
  return done;
}

/** Text for the Stripe Checkout line item. */
export function depositLabel(r: Reservation) {
  return r.lang === "es"
    ? `Depósito de reservación · ${r.partySize} persona${r.partySize > 1 ? "s" : ""} · ${RESTAURANT.name}`
    : `Reservation deposit · ${r.partySize} guest${r.partySize > 1 ? "s" : ""} · ${RESTAURANT.name}`;
}
