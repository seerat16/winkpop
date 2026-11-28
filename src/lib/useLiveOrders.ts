import { useEffect, useState } from "react";
import { useAppStore } from "@/data/appStore";
import { isBackendConfigured } from "./backend";
import { fetchLiveOrders } from "./liveSync";

/** Pull the user's real (paid) orders from the payments backend on mount. */
export function useLiveOrders(): { error: string | null } {
  const merge = useAppStore((s) => s.mergeLiveOrders);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isBackendConfigured()) return;
    let cancelled = false;
    fetchLiveOrders()
      .then((orders) => {
        if (!cancelled) merge(orders);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [merge]);
  return { error };
}
