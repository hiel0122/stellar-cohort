import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  getAllOverrides,
  subscribeOverrides,
  type CohortOverride,
} from "@/lib/cohortOverrides";

/**
 * React hook that subscribes to cohort overrides changes.
 * Returns the current overrides map and triggers re-renders on changes.
 */
export function useCohortOverrides() {
  return useSyncExternalStore(
    subscribeOverrides,
    getAllOverrides,
    getAllOverrides,
  );
}
