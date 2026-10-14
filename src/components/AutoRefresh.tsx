"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Reloads the page's data on an interval, so a request that is building or
// deleting shows its new status without a manual refresh.
export default function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
