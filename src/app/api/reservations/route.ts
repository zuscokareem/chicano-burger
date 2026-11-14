import { NextResponse } from "next/server";
import { BOOKING } from "@/lib/config";
import { createReservation, depositLabel, markPaid, validate, type NewReservation } from "@/lib/reservations";
import { store } from "@/lib/store";
import { stripe, toCents } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Partial<NewReservation>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const input: NewReservation = {
    date: String(body.date ?? ""),
    time: String(body.time ?? ""),
    partySize: Number(body.partySize),
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    notes: String(body.notes ?? ""),
    lang: body.lang === "es" ? "es" : "en",
  };
  const invalid = validate(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const result = await createReservation(input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  const r = result.reservation;
  const origin = new URL(req.url).origin;
  const manage = `${origin}/reservation/${r.id}?t=${r.token}`;

  // Demo mode: no Stripe key configured, confirm without taking money.
  if (!stripe) {
    await markPaid(r);
    return NextResponse.json({ id: r.id, redirect: `${manage}&new=1` });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "mxn",
    customer_email: r.email,
    locale: r.lang,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: toCents(r.depositMXN),
          product_data: {
            name: depositLabel(r),
            description:
              r.lang === "es"
                ? `${r.date} · ${r.time} · Se abona a tu cuenta al llegar. Si no llegas en ${BOOKING.graceMinutes} min, se retiene el 50%.`
                : `${r.date} · ${r.time} · Credited to your bill when you arrive. No-show after ${BOOKING.graceMinutes} min keeps 50%.`,
          },
        },
      },
    ],
    payment_intent_data: {
      description: `Chicano Burger reservation ${r.id}`,
      metadata: { reservationId: r.id },
    },
    metadata: { reservationId: r.id },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${manage}&new=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?cancelled=${r.id}#reserve`,
  });

  r.stripeSessionId = session.id;
  await store.put(r);
  return NextResponse.json({ id: r.id, redirect: session.url });
}
