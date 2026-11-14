"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BOOKING, RESTAURANT } from "@/lib/config";
import { formatTime } from "@/lib/copy";
import { Check, Lock, WhatsAppIcon } from "./Icons";
import { useLang } from "./LangProvider";

type Slot = { time: string; seatsLeft: number };

export default function ReserveWidget({ days, today, demo }: { days: string[]; today: string; demo: boolean }) {
  const { t, lang } = useLang();
  const r = t.reserve;
  const [date, setDate] = useState(days[0] ?? "");
  const [party, setParty] = useState(2);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelledBanner, setCancelledBanner] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).has("cancelled")) setCancelledBanner(true);
  }, []);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(null);
    fetch(`/api/availability?date=${date}`)
      .then((res) => res.json())
      .then((d) => alive && setSlots(d.slots ?? []))
      .catch(() => alive && setSlots([]));
    return () => {
      alive = false;
    };
  }, [date]);

  const slotOk = (s: Slot) => s.seatsLeft >= party;
  const chosen = slots?.find((s) => s.time === time);
  const validTime = chosen && slotOk(chosen);
  const deposit = party * BOOKING.depositPerGuestMXN;
  const ready = validTime && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 8 && agree;

  const dayLabel = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
    const top = d === today ? t.today : days.indexOf(d) === 1 && d === addOne(today) ? t.tomorrow : t.days[wd];
    return { top, num: dd, month: t.months[m - 1] };
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, partySize: party, ...form, lang }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirect) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.redirect;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      fetch(`/api/availability?date=${date}`)
        .then((x) => x.json())
        .then((d) => setSlots(d.slots ?? []));
    }
  }

  const summaryDate = date ? dayLabel(date) : null;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
      <div className="min-w-0 space-y-6">
        {cancelledBanner && (
          <p className="rounded-2xl border border-salsa/40 bg-salsa/10 px-4 py-3 text-sm text-bone">{r.cancelledBanner}</p>
        )}

        {/* 1 · Party */}
        <fieldset className="min-w-0 rounded-3xl border border-line bg-coal p-5 sm:p-6">
          <legend className="sr-only">{r.party}</legend>
          <StepLabel n={1} label={r.party} />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: BOOKING.maxPartySize }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setParty(n)}
                aria-pressed={party === n}
                className={`h-12 w-12 rounded-full border text-base font-semibold transition ${
                  party === n ? "border-gold bg-gold text-ink" : "border-line text-cream hover:border-gold/60"
                }`}
              >
                {n}
              </button>
            ))}
            <a
              href={RESTAURANT.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center gap-2 rounded-full border border-dashed border-line px-4 text-sm text-muted hover:border-wa hover:text-cream"
            >
              <WhatsAppIcon className="h-4 w-4 text-wa" /> {BOOKING.maxPartySize}+
            </a>
          </div>
        </fieldset>

        {/* 2 · Date */}
        <fieldset className="min-w-0 rounded-3xl border border-line bg-coal p-5 sm:p-6">
          <legend className="sr-only">{r.date}</legend>
          <StepLabel n={2} label={r.date} />
          <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {days.map((d) => {
              const l = dayLabel(d);
              const on = d === date;
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setTime("");
                  }}
                  aria-pressed={on}
                  className={`flex w-[4.6rem] shrink-0 snap-start flex-col items-center rounded-2xl border py-3 transition ${
                    on ? "border-gold bg-gold text-ink" : "border-line hover:border-gold/60"
                  }`}
                >
                  <span className={`text-[0.7rem] font-semibold uppercase tracking-wider ${on ? "text-ink/70" : "text-muted"}`}>{l.top}</span>
                  <span className="font-display text-2xl leading-tight">{l.num}</span>
                  <span className={`text-[0.7rem] uppercase ${on ? "text-ink/70" : "text-muted"}`}>{l.month}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 3 · Time */}
        <fieldset className="min-w-0 rounded-3xl border border-line bg-coal p-5 sm:p-6">
          <legend className="sr-only">{r.time}</legend>
          <StepLabel n={3} label={r.time} />
          <div className="mt-4">
            {slots === null ? (
              <p className="text-sm text-muted">{r.loading}</p>
            ) : slots.length === 0 || !slots.some(slotOk) ? (
              <p className="text-sm text-muted">{r.noSlots}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const ok = slotOk(s);
                  const on = s.time === time;
                  const hint = !ok ? r.full : r.seatsLeft(s.seatsLeft);
                  return (
                    <button
                      type="button"
                      key={s.time}
                      disabled={!ok}
                      onClick={() => setTime(s.time)}
                      aria-pressed={on}
                      className={`flex flex-col items-center rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                        on
                          ? "border-gold bg-gold text-ink"
                          : ok
                            ? "border-line hover:border-gold/60"
                            : "cursor-not-allowed border-line/50 text-muted/50 line-through"
                      }`}
                    >
                      {formatTime(s.time)}
                      {hint && <span className={`mt-0.5 text-[0.65rem] font-medium no-underline ${on ? "text-ink/70" : "text-salsa"}`}>{hint}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>

        {/* 4 · Details */}
        <fieldset className="min-w-0 rounded-3xl border border-line bg-coal p-5 sm:p-6">
          <legend className="sr-only">{r.details}</legend>
          <StepLabel n={4} label={r.details} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">{r.name}</span>
              <input className="field" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-muted">{r.email}</span>
              <input className="field" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-muted">{r.phone}</span>
              <input className="field" required type="tel" autoComplete="tel" placeholder="+52 322 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">{r.notes}</span>
              <textarea className="field min-h-20 resize-y" placeholder={r.notesPh} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-gold/30 bg-char shadow-[0_30px_80px_-40px_rgba(227,194,126,0.35)]">
          <div className="relative h-36">
            <Image src="/images/burger-hand.jpg" alt="" fill sizes="380px" className="object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-char via-char/40 to-transparent" />
            <p className="absolute bottom-3 left-5 font-gothic text-3xl text-cream">Chicano</p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{r.summary}</p>
            <dl className="space-y-2.5 text-sm">
              <Row label={r.date} value={summaryDate ? `${summaryDate.top} ${summaryDate.num} ${summaryDate.month}` : "—"} />
              <Row label={r.time} value={validTime ? formatTime(time) : "—"} />
              <Row label={r.party} value={r.guests(party)} />
            </dl>
            <div className="rounded-2xl border border-line bg-ink/60 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-bone">{r.deposit}</span>
                <span className="font-display text-3xl text-gold">MX${deposit}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {party} × MX${BOOKING.depositPerGuestMXN} · {r.depositNote}
              </p>
            </div>

            <label className="flex cursor-pointer gap-3 text-xs leading-relaxed text-bone">
              <span className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
                <span className="flex h-5 w-5 items-center justify-center rounded-md border border-line bg-ink transition peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40">
                  {agree && <Check className="h-3.5 w-3.5 text-ink" />}
                </span>
              </span>
              {r.agree}
            </label>

            {error && <p className="rounded-xl bg-salsa/15 px-3 py-2 text-sm text-cream">{error}</p>}

            <button type="submit" disabled={!ready || busy} className="btn-gold w-full text-[0.95rem]">
              {busy ? r.paying : demo ? r.payDemo : r.pay(deposit)}
            </button>
            {!validTime && <p className="text-center text-xs text-muted">{r.pickTime}</p>}
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> {r.secure}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function addOne(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10);
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 font-display text-sm text-gold">{n}</span>
      <span className="font-display text-xl uppercase tracking-wide">{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-cream">{value}</dd>
    </div>
  );
}
