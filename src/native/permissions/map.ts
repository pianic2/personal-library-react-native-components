import type { PermissionResult } from "./types.js";

/** The fields of an Expo permission response that matter here (structural: no Expo type is imported). */
export interface ExpoPermissionResponseLike {
  status?: string;
  granted?: boolean;
  canAskAgain?: boolean;
  /** expo-media-library: "all" | "limited" | "none". */
  accessPrivileges?: string;
  /** expo-location (iOS): scope "whenInUse" | "always" | "none" does not change the status mapping. */
  ios?: { status?: number };
}

const UNAVAILABLE: PermissionResult = { status: "unavailable", canAskAgain: false };

/**
 * Normalises an Expo permission response (pure, never throws).
 * granted -> granted (limited when `accessPrivileges` is "limited"); denied with `canAskAgain` false -> blocked; denied
 * otherwise -> denied; undetermined -> undetermined; anything unreadable -> unavailable.
 */
export function mapExpoPermission(response: ExpoPermissionResponseLike | null | undefined): PermissionResult {
  if (!response || typeof response !== "object") return UNAVAILABLE;
  const canAsk = response.canAskAgain !== false;
  const status = response.status ?? (response.granted === true ? "granted" : response.granted === false ? "denied" : undefined);
  if (status === "granted") return { status: response.accessPrivileges === "limited" ? "limited" : "granted", canAskAgain: true };
  if (status === "denied") return canAsk ? { status: "denied", canAskAgain: true } : { status: "blocked", canAskAgain: false };
  if (status === "undetermined") return { status: "undetermined", canAskAgain: canAsk };
  return UNAVAILABLE;
}
