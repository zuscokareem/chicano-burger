"use client";

import Image from "next/image";
import { useState } from "react";

export default function StaffLogin({ demoHint }: { demoHint?: string }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) window.location.reload();
    else setError("Wrong password / Contraseña incorrecta");
  }

  return (
    <main className="bandana flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-char p-8 text-center">
        <Image src="/images/logo-badge.png" alt="Chicano Burger" width={72} height={72} className="mx-auto" />
        <h1 className="mt-5 font-display text-3xl uppercase">Staff</h1>
        <p className="mt-1 text-sm text-muted">Reservaciones · Reservations</p>
        <input
          type="password"
          className="field mt-6"
          placeholder="Password / Contraseña"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        {error && <p className="mt-3 text-sm text-salsa">{error}</p>}
        <button className="btn-gold mt-4 w-full" disabled={busy || !pw}>
          {busy ? "…" : "Entrar"}
        </button>
        {demoHint && (
          <p className="mt-5 text-xs text-muted">
            Demo password: <code className="text-gold">{demoHint}</code>
          </p>
        )}
      </form>
    </main>
  );
}
