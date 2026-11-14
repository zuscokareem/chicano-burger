import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/** Null when no Stripe key is set: the site then runs in demo mode (no real payments). */
export const stripe = key ? new Stripe(key) : null;

export const demoMode = !stripe;
export const stripeLive = !!key?.startsWith("sk_live_");

/** Stripe amounts for MXN are in centavos. */
export const toCents = (mxn: number) => Math.round(mxn * 100);
