import type { Metadata } from "next";
import StaffDashboard from "@/components/StaffDashboard";
import StaffLogin from "@/components/StaffLogin";
import { BOOKING } from "@/lib/config";
import { DEMO_STAFF_PASSWORD, isStaff, staffPassword } from "@/lib/staff";
import { usingPersistentStore } from "@/lib/store";
import { demoMode } from "@/lib/stripe";
import { nowLocal } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };

export default async function StaffPage() {
  const pw = staffPassword();
  if (!pw) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center text-bone">
        Set the <code className="text-gold">STAFF_PASSWORD</code> environment variable in Vercel to use the staff dashboard.
      </main>
    );
  }
  if (!(await isStaff())) {
    return <StaffLogin demoHint={!process.env.STAFF_PASSWORD ? DEMO_STAFF_PASSWORD : undefined} />;
  }
  return (
    <StaffDashboard
      initialDate={nowLocal().date}
      graceMinutes={BOOKING.graceMinutes}
      warnings={[
        ...(demoMode ? ["Demo mode: no Stripe key set, so no real deposits are taken or refunded."] : []),
        ...(!usingPersistentStore ? ["Reservations are kept in server memory only and can disappear. Connect Upstash Redis in Vercel before launch."] : []),
      ]}
    />
  );
}
