"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/copy";
import type { Reservation } from "@/lib/store";
import { addDays, localToEpoch } from "@/lib/time";

type Row = Omit<Reservation, "token">;

const STATUS: Record<Row["status"], { label: string; cls: string }> = {
  pending: { label: "Pago pendiente · Unpaid", cls: "border-line text-muted" },
  confirmed: { label: "Confirmada · Confirmed", cls: "border-gold/60 text-gold" },
  arrived: { label: "Llegó · Arrived", cls: "border-emerald-500/50 text-emerald-400" },
  no_show: { label: "No llegó · No-show", cls: "border-salsa/60 text-salsa" },
  cancelled: { label: "Cancelada · Cancelled", cls: "border-line text-muted line-through" },
  expired: { label: "Expirada · Expired", cls: "border-line text-muted" },
};

export default function StaffDashboard({
  initialDate,
  graceMinutes,
  warnings,
}: {
  initialDate: string;
  graceMinutes: number;
  warnings: string[];
}) {
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/reservations?date=${date}`, { cache: "no-store" });
    if (res.status === 401) return window.location.reload();
    const data = await res.json();
    setRows(data.reservations);
  }, [date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(null);
    load();
    const poll = setInterval(load, 30_000);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  async function act(r: Row, action: "checkin" | "noshow" | "cancel") {
    const confirmText =
      action === "noshow"
        ? `¿Marcar a ${r.name} como NO LLEGÓ? Se retienen MX$${Math.round(r.depositMXN / 2)} y se reembolsan MX$${r.depositMXN - Math.round(r.depositMXN / 2)}.\n\nMark as no-show? Keeps 50% of the deposit, refunds 50%.`
        : action === "cancel"
          ? `¿Cancelar la reservación de ${r.name}? Se reembolsa el depósito completo (MX$${r.depositMXN}).\n\nCancel and refund the full deposit?`
          : null;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(r.id);
    setMsg("");
    const res = await fetch(`/api/staff/reservations/${r.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusyId("");
    if (!res.ok) setMsg(data.error || "Error");
    load();
  }

  async function logout() {
    await fetch("/api/staff/login", { method: "DELETE" });
    window.location.reload();
  }

  const active = (rows ?? []).filter((r) => r.status !== "cancelled" && r.status !== "pending");
  const covers = active.reduce((s, r) => s + r.partySize, 0);
  const arrived = active.filter((r) => r.status === "arrived").reduce((s, r) => s + r.partySize, 0);
  const noShows = active.filter((r) => r.status === "no_show").length;
  const kept = (rows ?? []).reduce((s, r) => s + (r.keptMXN ?? 0), 0);

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo-badge.png" alt="" width={36} height={36} />
            <span className="font-display text-xl uppercase">Reservaciones</span>
          </div>
          <button onClick={logout} className="text-sm text-muted hover:text-cream">
            Salir · Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {warnings.map((w) => (
          <p key={w} className="mb-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm text-gold">
            {w}
          </p>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="btn-ghost !px-4 !py-2" aria-label="Previous day">
            ←
          </button>
          <button onClick={() => setDate(initialDate)} className="btn-ghost !px-4 !py-2 text-sm">
            Hoy · Today
          </button>
          <button onClick={() => setDate(addDays(date, 1))} className="btn-ghost !px-4 !py-2" aria-label="Next day">
            →
          </button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="field !w-auto !py-2" />
          <h1 className="ml-1 font-display text-2xl uppercase capitalize">{formatDate(date, "es", true)}</h1>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Personas · Covers" value={covers} />
          <Stat label="Llegaron · Arrived" value={arrived} />
          <Stat label="No llegaron · No-shows" value={noShows} />
          <Stat label="Retenido · Kept" value={`MX$${kept}`} />
        </div>

        {msg && <p className="mt-4 rounded-xl bg-salsa/15 px-4 py-2.5 text-sm">{msg}</p>}

        <div className="mt-6 space-y-3">
          {rows === null && <p className="text-muted">Cargando…</p>}
          {rows?.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">Sin reservaciones · No reservations</p>}
          {rows?.map((r) => {
            const start = localToEpoch(r.date, r.time);
            const lateMin = Math.floor((now - start) / 60_000);
            const canNoShow = r.status === "confirmed" && lateMin >= graceMinutes;
            const late = r.status === "confirmed" && lateMin > 0;
            const s = STATUS[r.status];
            return (
              <div
                key={r.id}
                className={`rounded-2xl border bg-coal p-4 sm:p-5 ${canNoShow ? "border-salsa/70" : late ? "border-gold/50" : "border-line"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-20 shrink-0">
                      <p className="font-display text-2xl">{formatTime(r.time)}</p>
                      <p className="text-xs text-muted">{r.id}</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {r.name} <span className="font-normal text-muted">· {r.partySize} pers.</span>
                      </p>
                      <p className="mt-0.5 text-sm text-bone">
                        <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-gold">
                          {r.phone}
                        </a>{" "}
                        · {r.email}
                      </p>
                      {r.notes && <p className="mt-1.5 text-sm text-gold">“{r.notes}”</p>}
                      <p className="mt-1.5 text-xs text-muted">
                        Depósito MX${r.depositMXN}
                        {r.status === "arrived" && " · abonar a la cuenta / credit to bill"}
                        {r.keptMXN ? ` · retenido MX$${r.keptMXN}` : ""}
                        {r.refundedMXN ? ` · reembolsado MX$${r.refundedMXN}` : ""}
                        {r.demo ? " · demo" : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                </div>

                {r.status === "confirmed" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(r, "checkin")}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-ink hover:bg-emerald-400 disabled:opacity-50"
                    >
                      ✓ Llegó · Arrived
                    </button>
                    <button
                      disabled={!canNoShow || busyId === r.id}
                      onClick={() => act(r, "noshow")}
                      className="rounded-full border border-salsa px-5 py-2.5 text-sm font-semibold text-salsa hover:bg-salsa/10 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
                    >
                      No llegó · No-show (50%)
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => act(r, "cancel")}
                      className="rounded-full px-4 py-2.5 text-sm text-muted hover:text-cream"
                    >
                      Cancelar + reembolso
                    </button>
                    <span className={`ml-auto text-xs ${late ? "text-salsa" : "text-muted"}`}>
                      {lateMin < 0
                        ? `En ${-lateMin} min`
                        : !canNoShow
                          ? `${lateMin} min tarde · no-show en ${graceMinutes - lateMin} min`
                          : `${lateMin} min tarde · ya puede marcarse no-show`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          Marca “Llegó” cuando la mesa se siente: el depósito se descuenta de la cuenta. Después de {graceMinutes} min sin llegar, “No llegó” retiene el 50% y
          reembolsa el otro 50%. Cada noche al cierre, las reservaciones confirmadas que nadie marcó se procesan como no-show automáticamente.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-coal px-4 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl text-cream">{value}</p>
    </div>
  );
}
