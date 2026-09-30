"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

// While the run is queued or running, re-render the server data every 2 s; stops once it is done or failed.
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(timer);
  }, [active, router]);
  return null;
}
