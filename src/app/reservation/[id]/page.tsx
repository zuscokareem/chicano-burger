import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReservationView from "@/components/ReservationView";
import { LangProvider } from "@/components/LangProvider";
import { cancelTerms, getReservation, markPaid } from "@/lib/reservations";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your reservation", robots: { index: false } };

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; session_id?: string; new?: string }>;
}) {
  const { id } = await params;
  const { t: token, session_id } = await searchParams;
  let r = await getReservation(id);
  if (!r || !token || token !== r.token) notFound();

  // Coming back from Stripe Checkout: confirm right away instead of waiting for the webhook.
  if (r.status === "pending" && session_id && stripe && session_id === r.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      r = await markPaid(r, typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id);
    }
  }

  const safe = { ...r, token: undefined, history: undefined };
  return (
    <LangProvider initial={r.lang}>
      <ReservationView r={safe} token={token} terms={cancelTerms(r)} />
    </LangProvider>
  );
}
