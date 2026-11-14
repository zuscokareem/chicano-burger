"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RESTAURANT } from "@/lib/config";
import { Clock, FacebookIcon, InstagramIcon, Pin, Star, WhatsAppIcon } from "./Icons";
import { LangToggle, useLang } from "./LangProvider";
import ReserveWidget from "./ReserveWidget";

export default function Landing({ days, today, demo }: { days: string[]; today: string; demo: boolean }) {
  const { t } = useLang();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee items={t.marquee} />
        <Story />
        <Burger />
        <How />
        <Reviews />
        <section id="reserve" className="relative scroll-mt-16 border-t border-line bg-ink py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead kicker={t.reserve.kicker} title={t.reserve.title} sub={t.reserve.sub} />
            <div className="mt-12">
              <ReserveWidget days={days} today={today} demo={demo} />
            </div>
          </div>
        </section>
        <Visit />
        <FinalCta />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}

function Header() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links: [string, string][] = [
    ["#burger", t.nav.burger],
    ["#story", t.nav.story],
    ["#reviews", t.nav.reviews],
    ["#visit", t.nav.visit],
  ];
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b border-line bg-ink/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Chicano Burger">
          <Image src="/images/logo-badge.png" alt="" width={40} height={40} className="h-10 w-10" priority />
          <span className="leading-none">
            <span className="block font-gothic text-xl text-cream sm:text-2xl">Chicano</span>
            <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-gold">Burger</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-bone md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="transition hover:text-gold">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangToggle />
          <a href="#reserve" className="btn-gold hidden !px-5 !py-2.5 text-sm sm:inline-flex">
            {t.nav.reserve}
          </a>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-px w-4 bg-cream transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-px w-4 bg-cream transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-px w-4 bg-cream transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line px-4 pb-5 pt-2 md:hidden">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-line/60 py-3.5 text-lg text-cream">
              {label}
            </a>
          ))}
          <a href="#reserve" onClick={() => setOpen(false)} className="btn-gold mt-4 w-full">
            {t.nav.reserve}
          </a>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  const { t } = useLang();
  const h = t.hero;
  return (
    <section id="top" className="grain relative overflow-hidden pt-16 sm:pt-[72px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(185,143,67,0.22),transparent_55%)]" aria-hidden />
      <div className="relative mx-auto grid min-h-[88vh] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
        <p className="kicker rise">{h.eyebrow}</p>
        <h1 className="rise rise-2 mt-6 font-display uppercase leading-[0.92] tracking-tight">
          <span className="block text-[13vw] text-cream/90 sm:text-7xl xl:text-8xl">{h.line1}</span>
          <span className="block text-[13vw] text-cream/90 sm:text-7xl xl:text-8xl">{h.line2}</span>
          <span className="mt-1 block font-gothic text-[22vw] normal-case leading-[0.95] text-gold-grad sm:text-[9.5rem] xl:text-[10.5rem]">{h.line3}</span>
        </h1>
        <p className="rise rise-3 mt-6 max-w-xl text-base leading-relaxed text-bone sm:text-lg">{h.sub}</p>
        <div className="rise rise-4 mt-9 flex flex-col gap-3 sm:flex-row">
          <a href="#reserve" className="btn-gold text-base">
            {h.cta} <span aria-hidden>→</span>
          </a>
          <a href={RESTAURANT.whatsappUrl} target="_blank" rel="noreferrer" className="btn-ghost">
            <WhatsAppIcon className="h-5 w-5 text-wa" /> {h.ctaAlt}
          </a>
        </div>
        <dl className="rise rise-4 mt-12 grid max-w-xl grid-cols-3 gap-3 border-t border-line/80 pt-6 text-xs sm:gap-4 sm:text-sm [&_dt]:text-xl sm:[&_dt]:text-2xl">
          <div>
            <dt className="font-display text-2xl text-cream">{RESTAURANT.googleRating}</dt>
            <dd className="mt-1 flex gap-0.5 text-gold">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5" />
              ))}
            </dd>
            <dd className="mt-0.5 text-muted">{h.stat1}</dd>
          </div>
          <div>
            <dt className="font-display text-2xl text-cream">6:30 PM</dt>
            <dd className="mt-1 text-muted">{h.stat2}</dd>
          </div>
          <div>
            <dt className="font-display text-2xl text-cream">{RESTAURANT.priceRange}</dt>
            <dd className="mt-1 text-muted">{h.stat3}</dd>
          </div>
        </dl>
        </div>

        <div className="rise rise-3 relative mx-auto w-full max-w-[520px]">
          <div className="absolute -inset-3 -rotate-2 rounded-[2.2rem] checker opacity-90" aria-hidden />
          <div className="relative overflow-hidden rounded-[2rem] border border-line shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
            <Image
              src="/images/burger-hand.jpg"
              alt={t.burger.handAlt}
              width={720}
              height={416}
              priority
              sizes="(min-width: 1024px) 520px, 92vw"
              className="aspect-[4/3.4] w-full object-cover object-[45%_50%]"
            />
          </div>
          <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-line bg-ink/95 px-4 py-3 shadow-xl sm:-left-8">
            <Image src="/images/logo-badge.png" alt="" width={44} height={44} />
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Cali style burger</p>
              <p className="text-sm text-cream">150 g · Monterey Jack · Salsa Chicana</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="relative border-y border-line">
      <div className="checker h-3" aria-hidden />
      <div className="overflow-hidden bg-gold py-4 text-ink">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl uppercase tracking-wide sm:text-3xl">
          {[...row, ...row].map((s, i) => (
            <span key={i} className="flex items-center gap-10">
              {s} <span aria-hidden className="text-ink/50">✦</span>
            </span>
          ))}
        </div>
      </div>
      <div className="checker h-3" aria-hidden />
    </div>
  );
}

function SectionHead({ kicker, title, sub, center = true }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="kicker">{kicker}</p>
      <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] text-cream sm:text-6xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-bone sm:text-lg">{sub}</p>}
    </div>
  );
}

function Story() {
  const { t } = useLang();
  const s = t.story;
  return (
    <section id="story" className="bandana relative py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <SectionHead kicker={s.kicker} title={s.title} center={false} />
          <p className="mt-6 text-lg leading-relaxed text-bone">{s.p1}</p>
          <p className="mt-4 text-lg leading-relaxed text-bone">{s.p2}</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 rounded-full bg-gold/10 blur-3xl" aria-hidden />
          <Image src="/images/logo-badge.png" alt="Chicano Burger logo" width={484} height={484} className="relative w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]" />
        </div>
      </div>
      <div className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
        {s.pillars.map((p, i) => (
          <div key={p.title} className="rounded-3xl border border-line bg-ink/70 p-6">
            <p className="font-display text-sm text-gold">0{i + 1}</p>
            <h3 className="mt-3 font-display text-2xl uppercase text-cream">{p.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Burger() {
  const { t } = useLang();
  const b = t.burger;
  return (
    <section id="burger" className="relative overflow-hidden bg-ink py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_50%_40%,rgba(227,194,126,0.18),transparent_60%)]" aria-hidden />
          <Image
            src="/images/burger-anatomy.jpg"
            alt={b.anatomyAlt}
            width={600}
            height={791}
            sizes="(min-width: 1024px) 520px, 90vw"
            className="relative mx-auto w-full max-w-[520px] rounded-[2rem] border border-line shadow-2xl"
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="kicker">{b.kicker}</p>
          <h2 className="mt-4 font-gothic text-7xl leading-none text-gold-grad sm:text-8xl">{b.title}</h2>
          <p className="mt-2 font-display text-3xl uppercase text-cream sm:text-4xl">{b.titleSub}</p>
          <p className="mt-5 text-lg leading-relaxed text-bone">{b.intro}</p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {b.layers.map(([name, desc], i) => (
              <li key={name} className="flex gap-4 py-3.5">
                <span className="w-6 shrink-0 pt-0.5 font-display text-sm text-gold/70">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="font-semibold text-cream">{name}</span>
                  <span className="block text-sm text-muted">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-2 text-bone">
            <p>🍟 {b.fries}</p>
            <p>🌺 {b.drink}</p>
          </div>
          <a href={RESTAURANT.whatsappUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 font-semibold text-gold underline-offset-4 hover:underline">
            <WhatsAppIcon className="h-4 w-4 text-wa" /> {b.menu} →
          </a>
        </div>
      </div>
    </section>
  );
}

function How() {
  const { t } = useLang();
  const h = t.how;
  return (
    <section className="relative border-t border-line bg-coal py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker={h.kicker} title={h.title} sub={h.sub} />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {h.steps.map(([title, body], i) => (
            <div key={title} className="relative rounded-3xl border border-line bg-ink p-7">
              <span className="font-gothic text-6xl leading-none text-gold/90">{i + 1}</span>
              <h3 className="mt-4 font-display text-2xl uppercase text-cream">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-gold/30 bg-gold/[0.04] p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-display text-xl uppercase tracking-wide text-gold">
            <Clock className="h-5 w-5" /> {h.policyTitle}
          </h3>
          <ul className="mt-4 space-y-3 text-bone">
            {h.policy.map((p) => (
              <li key={p} className="flex gap-3 leading-relaxed">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 text-center">
          <a href="#reserve" className="btn-gold">
            {t.nav.reserve} →
          </a>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const { t } = useLang();
  const r = t.reviews;
  return (
    <section id="reviews" className="relative overflow-hidden bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker={r.kicker} title={r.title} sub={r.sub} />
        <div className="mt-6 flex justify-center gap-1 text-gold">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-6 w-6" />
          ))}
        </div>
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {r.items.map(([quote, who]) => (
            <figure key={who} className="mb-4 break-inside-avoid rounded-3xl border border-line bg-coal p-6">
              <div className="flex gap-0.5 text-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5" />
                ))}
              </div>
              <blockquote className="mt-4 text-lg leading-relaxed text-cream">“{quote}”</blockquote>
              <figcaption className="mt-4 text-sm text-muted">
                <span className="font-semibold text-bone">{who}</span> · Google
              </figcaption>
            </figure>
          ))}
        </div>
        {r.translated && <p className="mt-4 text-center text-xs text-muted">{r.translated}</p>}
      </div>
    </section>
  );
}

function Visit() {
  const { t } = useLang();
  const v = t.visit;
  return (
    <section id="visit" className="border-t border-line bg-coal py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead kicker={v.kicker} title={v.title} center={false} />
          <div className="mt-10 space-y-7">
            <Info icon={<Pin />} label={v.address}>
              {RESTAURANT.street}
              <br />
              {RESTAURANT.neighborhood}, {RESTAURANT.postalCode}
              <br />
              {RESTAURANT.city}
            </Info>
            <Info icon={<Clock />} label={v.hours}>
              {v.hoursValue}
              <br />
              <span className="text-muted">{v.closed}</span>
            </Info>
            <Info icon={<WhatsAppIcon className="h-5 w-5" />} label={v.contact}>
              <a href={RESTAURANT.whatsappUrl} target="_blank" rel="noreferrer" className="text-cream hover:text-gold">
                {RESTAURANT.phoneDisplay}
              </a>
              <br />
              <span className="text-muted">{v.ways}</span>
            </Info>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={RESTAURANT.mapsUrl} target="_blank" rel="noreferrer" className="btn-gold">
              {v.directions} →
            </a>
            <a href={RESTAURANT.instagramUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-4" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href={RESTAURANT.facebookUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-4" aria-label="Facebook">
              <FacebookIcon />
            </a>
          </div>
        </div>
        <div className="min-h-[340px] overflow-hidden rounded-3xl border border-line">
          <iframe
            title="Chicano Burger map"
            src={RESTAURANT.mapsEmbedUrl}
            className="h-full min-h-[340px] w-full grayscale invert-[0.9] hue-rotate-180"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function Info({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-gold">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{label}</p>
        <p className="mt-1.5 leading-relaxed text-bone">{children}</p>
      </div>
    </div>
  );
}

function FinalCta() {
  const { t } = useLang();
  return (
    <section className="grain relative overflow-hidden">
      <Image src="/images/burger-hand.jpg" alt="" fill sizes="100vw" className="object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
        <h2 className="font-display text-5xl uppercase leading-[0.95] text-cream sm:text-7xl">{t.final.title}</h2>
        <p className="mt-4 text-lg text-bone">{t.final.sub}</p>
        <a href="#reserve" className="btn-gold mt-9 text-base">
          {t.final.cta} →
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line bg-ink pb-28 pt-12 sm:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-muted sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/images/logo-badge.png" alt="" width={36} height={36} />
          <span>
            © {new Date().getFullYear()} Chicano Burger · Puerto Vallarta. {t.footer.rights}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a href={RESTAURANT.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-gold">
            @chicano.burger
          </a>
          <a href="/staff" className="hover:text-gold">
            {t.footer.staff}
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Sticky reserve bar on phones. */
function MobileBar() {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const reserve = document.getElementById("reserve");
      const inReserve = reserve ? reserve.getBoundingClientRect().top < window.innerHeight && reserve.getBoundingClientRect().bottom > 0 : false;
      setShow(window.scrollY > 500 && !inReserve);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex gap-2">
        <a href="#reserve" className="btn-gold flex-1 !py-3.5">
          {t.nav.reserve}
        </a>
        <a href={RESTAURANT.whatsappUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-4 !py-3.5" aria-label="WhatsApp">
          <WhatsAppIcon className="h-5 w-5 text-wa" />
        </a>
      </div>
    </div>
  );
}
