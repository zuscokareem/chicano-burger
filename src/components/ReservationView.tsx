"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RESTAURANT } from "@/lib/config";
import { formatDate, formatTime } from "@/lib/copy";
import type { Reservation } from "@/lib/store";
import { localToEpoch } from "@/lib/time";
import { Check, Clock, Pin, WhatsAppIcon } from "./Icons";
import { LangToggle, useLang } from "./LangProvider";

type SafeReservation = Omit<Reservation, "token" | "history">;

function gcalLink(r: SafeReservation) {
  const start = localToEpoch(r.date, r.time);
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Chicano Burger · ${r.partySize}`,
    dates: `${fmt(start)}/${fmt(start + 90 * 60_000)}`,
    details: `Reservation ${r.id}`,
    location: RESTAURANT.fullAddress,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default function ReservationView({
  r: initial,
  token,
  terms,
}: {
  r: SafeReservation;
  token: string;
  terms: { early: boolean; kept: number; refund: number };
}) {
  const { t, lang } = useLang();
  const c = t.confirm;
  const [r, setR] = useState(initial);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Payment still settling: refresh until the webhook confirms it.
  useEffect(() => {
    if (r.status !== "pending") return;
    const id = setTimeout(() => window.location.reload(), 4000);
    return () => clearTimeout(id);
  }, [r.status]);

  async function doCancel() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/reservations/${r.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Error");
    setR({ ...r, status: data.status, refundedMXN: data.refundedMXN, keptMXN: data.keptMXN });
    setAsking(false);
  }

  const heading =
    r.status === "confirmed" ? c.confirmed
    : r.status === "pending" ? c.pending
    : r.status === "cancelled" ? c.cancelled
    : r.status === "arrived" ? c.arrived
    : r.status === "no_show" ? c.noShow
    : c.expired;
  const ok = r.status === "confirmed" || r.status === "arrived";

  return (
    <div className="bandana min-h-screen">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-badge.png" alt="Chicano Burger" width={36} height={36} />
          <span className="font-gothic text-2xl">Chicano</span>
        </Link>
        <LangToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <div className="text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${ok ? "bg-gold text-ink" : "border border-line text-muted"}`}
          >
            {ok ? <Check className="h-8 w-8" /> : <Clock className="h-7 w-7" />}
          </span>
          <h1 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">{heading}</h1>
          {r.status === "confirmed" && <p className="mt-3 text-lg text-bone">{c.confirmedSub}</p>}
          {r.status === "pending" && <p className="mt-3 text-bone">{c.pendingSub}</p>}
          {r.demo && <p className="mx-auto mt-4 inline-block rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">{c.demo}</p>}
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-gold/30 bg-char">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{c.code}</span>
            <span className="whitespace-nowrap font-display text-2xl tracking-wider text-gold">{r.id}</span>
          </div>
          <dl className="grid gap-5 p-6 sm:grid-cols-2">
            <Item label={c.when} value={`${formatDate(r.date, lang, true)} · ${formatTime(r.time)}`} />
            <Item label={c.guests} value={t.reserve.guests(r.partySize)} />
            <Item label={c.name} value={r.name} />
            <Item label={c.deposit} value={`MX$${r.depositMXN}`} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{c.where}</dt>
              <dd className="mt-1 flex items-start gap-2 text-cream">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={RESTAURANT.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-gold">
                  {RESTAURANT.street}, {RESTAURANT.neighborhood}, Puerto Vallarta
                </a>
              </dd>
            </div>
          </dl>
          {r.status === "confirmed" && (
            <p className="border-t border-line bg-gold/[0.06] px-6 py-4 text-sm text-bone">⏱ {c.reminder}</p>
          )}
          {(r.refundedMXN || r.keptMXN) && (r.status === "cancelled" || r.status === "no_show") ? (
            <div className="space-y-1 border-t border-line px-6 py-4 text-sm text-bone">
              {!!r.refundedMXN && <p>{c.refunded(r.refundedMXN)}</p>}
              {!!r.keptMXN && <p>{c.kept(r.keptMXN)}</p>}
            </div>
          ) : null}
        </div>

        {r.status === "confirmed" && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={gcalLink(r)} target="_blank" rel="noreferrer" className="btn-gold">
                {c.calendar}
              </a>
              <a href={RESTAURANT.whatsappUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                <WhatsAppIcon className="h-5 w-5 text-wa" /> {c.whatsapp}
              </a>
            </div>
            <p className="mt-4 text-center text-sm text-muted">{c.save}</p>

            <div className="mt-12 rounded-3xl border border-line bg-coal p-6">
              <h2 className="font-display text-xl uppercase">{c.cancelTitle}</h2>
              <p className="mt-2 text-sm text-bone">{terms.early ? c.cancelFree : c.cancelLate(terms.kept, terms.refund)}</p>
              {error && <p className="mt-3 text-sm text-salsa">{error}</p>}
              {!asking ? (
                <button type="button" onClick={() => setAsking(true)} className="btn-ghost mt-4 !py-2.5 text-sm">
                  {c.cancelBtn}
                </button>
              ) : (
                <div className="mt-4 flex gap-3">
                  <button type="button" disabled={busy} onClick={doCancel} className="rounded-full bg-salsa px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-50">
                    {busy ? "…" : c.cancelSure}
                  </button>
                  <button type="button" onClick={() => setAsking(false)} className="btn-ghost !py-2.5 text-sm">
                    {c.keep}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <p className="mt-12 text-center">
          <Link href="/" className="text-sm text-gold underline-offset-4 hover:underline">
            ← {c.back}
          </Link>
        </p>
      </main>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="mt-1 text-lg first-letter:uppercase text-cream">{value}</dd>
    </div>
  );
}
