import { useSyncExternalStore } from "react";
import {
  loadPlatformCosts,
  subscribePlatformCostStore,
  type PlatformCost,
} from "@/lib/platformCostStore";

let snapshot: PlatformCost[] = [];
let initialized = false;

function getSnapshot() {
  if (!initialized) {
    snapshot = loadPlatformCosts();
    initialized = true;
  }
  return snapshot;
}

function subscribe(cb: () => void) {
  return subscribePlatformCostStore(() => {
    snapshot = loadPlatformCosts();
    cb();
  });
}

export function usePlatformCosts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
