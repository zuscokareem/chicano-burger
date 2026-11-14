import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getReservation, markPaid } from "@/lib/reservations";
import { store } from "@/lib/store";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const paidEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (paidEvents.includes(event.type) || event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.reservationId;
    const r = id ? await getReservation(id) : null;
    if (r) {
      if (paidEvents.includes(event.type) && session.payment_status === "paid") {
        await markPaid(r, typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id);
      } else if (event.type === "checkout.session.expired" && r.status === "pending") {
        r.status = "expired";
        r.updatedAt = Date.now();
        r.history.push({ at: r.updatedAt, event: "Checkout expired without payment" });
        await store.put(r);
      }
    }
  }
  return NextResponse.json({ received: true });
}
