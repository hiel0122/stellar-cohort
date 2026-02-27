import { useSyncExternalStore, useCallback } from "react";
import { loadRawCohorts, subscribeRawStore } from "@/lib/rawCohortStore";

/**
 * React hook that subscribes to raw cohort store changes.
 * Returns a stable snapshot array (same reference if unchanged).
 */
let snapshot: ReturnType<typeof loadRawCohorts> = [];
let initialized = false;

function getSnapshot() {
  if (!initialized) {
    snapshot = loadRawCohorts();
    initialized = true;
  }
  return snapshot;
}

// Subscribe wrapper that updates snapshot on change
function subscribe(cb: () => void) {
  return subscribeRawStore(() => {
    snapshot = loadRawCohorts();
    cb();
  });
}

export function useRawCohortStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
