import { Redis } from "@upstash/redis";

export type ReservationStatus =
  | "pending" // waiting for deposit payment
  | "confirmed" // deposit paid, table held
  | "arrived" // checked in by staff, deposit credited to the bill
  | "no_show" // not in within the grace period, 50% of deposit kept
  | "cancelled" // cancelled by guest or staff
  | "expired"; // checkout abandoned

export type Reservation = {
  id: string; // short code shown to guests, e.g. CB-7K3QX
  token: string; // secret for the guest's manage link
  date: string; // local date YYYY-MM-DD
  time: string; // local time HH:MM
  partySize: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  lang: "en" | "es";
  depositMXN: number;
  status: ReservationStatus;
  createdAt: number;
  updatedAt: number;
  stripeSessionId?: string;
  paymentIntentId?: string;
  refundedMXN?: number;
  keptMXN?: number;
  demo?: boolean; // made without Stripe keys (no real money)
  history: { at: number; event: string }[];
};

interface Store {
  get(id: string): Promise<Reservation | null>;
  put(r: Reservation): Promise<void>;
  listDay(date: string): Promise<Reservation[]>;
}

function redisFromEnv(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}
  async get(id: string) {
    return (await this.redis.get<Reservation>(`res:${id}`)) ?? null;
  }
  async put(r: Reservation) {
    await this.redis.set(`res:${r.id}`, r);
    await this.redis.sadd(`day:${r.date}`, r.id);
  }
  async listDay(date: string) {
    const ids = await this.redis.smembers(`day:${date}`);
    if (!ids.length) return [];
    const rows = await this.redis.mget<(Reservation | null)[]>(...ids.map((id) => `res:${id}`));
    return rows.filter((r): r is Reservation => !!r);
  }
}

/** Fallback for local development and demos: lives in server memory, lost on restart. */
class MemoryStore implements Store {
  private map: Map<string, Reservation>;
  constructor() {
    const g = globalThis as unknown as { __chicanoRes?: Map<string, Reservation> };
    this.map = g.__chicanoRes ??= new Map();
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
  async put(r: Reservation) {
    this.map.set(r.id, structuredClone(r));
  }
  async listDay(date: string) {
    return [...this.map.values()].filter((r) => r.date === date);
  }
}

const redis = redisFromEnv();
export const store: Store = redis ? new RedisStore(redis) : new MemoryStore();
export const usingPersistentStore = !!redis;
