# Chicano Burger · Puerto Vallarta

Website and table reservations for Chicano Burger (Calle Colombia y Argentina, Col. 5 de Diciembre, Puerto Vallarta). Next.js 16 on Vercel. English/Spanish.

## How reservations work

1. The guest picks party size (1–8), date and time (Mon–Sat, 6:30–10:00 PM seatings, every 30 min, 16 seats per slot).
2. They pay a deposit of **MX$100 per guest** by card through Stripe Checkout.
3. When they arrive, staff tap **Llegó / Arrived** at `/staff`. The deposit is credited to the bill.
4. If they are not there **15 minutes** after their time, staff can tap **No llegó / No-show**: the restaurant keeps **50%** of the deposit and the other 50% is refunded automatically through Stripe.
5. A nightly job (Vercel Cron, 00:00 Puerto Vallarta time) marks any confirmed reservation nobody checked in as a no-show, with the same 50/50 split. Set `AUTO_NO_SHOW=false` to turn this off.
6. Guests can cancel from the link on their confirmation page: full refund 2+ hours ahead, otherwise the same 50% applies.

All of these numbers live in `src/lib/config.ts`.

## Going live checklist

| Env var (Vercel) | What it is |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key. Without it the site runs in **demo mode** (no charge). |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook to `https://<domain>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis from the Vercel Marketplace (free tier is enough). Without it reservations live in server memory and get lost. |
| `STAFF_PASSWORD` | Password for `/staff`. Until it's set (and only while there's no live Stripe key) the demo password is `chicano-demo`. |
| `CRON_SECRET` | Any long random string; Vercel sends it to the nightly no-show job. |

Stripe: keep payment methods to **cards** (OXXO and other delayed methods take days to confirm, longer than seats are held).

## Local development

```bash
npm ci
cp .env.example .env.local   # optional; leave empty for demo mode
npm run dev
```

Pages: `/` (site + booking), `/reservation/<code>?t=<token>` (guest confirmation and cancel), `/staff` (dashboard).
