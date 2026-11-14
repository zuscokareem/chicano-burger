import Landing from "@/components/Landing";
import { LangProvider } from "@/components/LangProvider";
import { demoMode } from "@/lib/stripe";
import { nowLocal, openDays } from "@/lib/time";

// Rebuilt every few minutes so the date picker always starts at "today" in Puerto Vallarta.
export const revalidate = 300;

export default function Home() {
  const days = openDays(14);
  return (
    <LangProvider>
      <Landing days={days} today={nowLocal().date} demo={demoMode} />
    </LangProvider>
  );
}
