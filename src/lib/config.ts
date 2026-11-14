// Everything the restaurant might want to change lives here.
// Sources: Google Business listing, Facebook page and Instagram (@chicano.burger), Nov 2026.

export const RESTAURANT = {
  name: "Chicano Burger",
  tagline: "Cali Style Burger",
  street: "Calle Colombia y Argentina",
  neighborhood: "Col. 5 de Diciembre",
  city: "Puerto Vallarta, Jalisco",
  postalCode: "48350",
  fullAddress: "Calle Colombia y Argentina, 5 de Diciembre, 48350 Puerto Vallarta, Jal., México",
  phoneDisplay: "+52 322 445 8661",
  phoneE164: "+523224458661",
  whatsappUrl: "https://wa.me/523224458661",
  instagramUrl: "https://www.instagram.com/chicano.burger/",
  facebookUrl: "https://www.facebook.com/61595378025978/",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chicano+Burger+Colombia+y+Argentina+Puerto+Vallarta",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=Chicano+Burger,+Colombia+y+Argentina,+5+de+Diciembre,+Puerto+Vallarta&output=embed",
  googleRating: "5.0",
  googleReviewCount: 9,
  priceRange: "MX$100–200",
} as const;

/** Puerto Vallarta (Jalisco) is on Mexico's Central Time: UTC-6 all year (no DST since 2022). */
export const UTC_OFFSET_HOURS = -6;

/**
 * Opening hours. 0 = Sunday ... 6 = Saturday. `null` = closed.
 * Google: opens 6:30 PM. Facebook: Monday to Saturday from 6:30. Instagram: 6:30–11:00 PM.
 */
export const HOURS: Record<number, { open: string; close: string } | null> = {
  0: null,
  1: { open: "18:30", close: "23:00" },
  2: { open: "18:30", close: "23:00" },
  3: { open: "18:30", close: "23:00" },
  4: { open: "18:30", close: "23:00" },
  5: { open: "18:30", close: "23:00" },
  6: { open: "18:30", close: "23:00" },
};

export const BOOKING = {
  /** Minutes between reservation times. */
  slotMinutes: 30,
  /** Last time a table can be reserved (kitchen closes at 11). */
  lastSeating: "22:00",
  /** Seats available per time slot across all tables. */
  seatsPerSlot: 16,
  /** Bigger groups are asked to message on WhatsApp. */
  maxPartySize: 8,
  /** How far ahead guests can book. */
  daysAhead: 30,
  /** Same-day bookings close this many minutes before the slot. */
  minNoticeMinutes: 30,
  /** Deposit per guest, in Mexican pesos. Credited to the bill on arrival. */
  depositPerGuestMXN: 100,
  /** Grace period after the reservation time before it counts as a no-show. */
  graceMinutes: 15,
  /** Share of the deposit the restaurant keeps on a no-show (0.5 = 50%). */
  noShowKeepShare: 0.5,
  /** Cancel at least this many hours ahead for a full refund. Later cancellations count as a no-show. */
  freeCancelHours: 2,
  /** Unpaid checkouts hold their seats this long (Stripe Checkout minimum is 30 min). */
  pendingHoldMinutes: 35,
};
