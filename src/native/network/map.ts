import type { NetworkType } from "../core/types.js";

const TYPES: readonly NetworkType[] = ["wifi", "cellular", "ethernet", "bluetooth", "vpn", "other", "none", "unknown"];
export const toType = (raw: unknown): NetworkType => {
  const t = typeof raw === "string" ? raw.toLowerCase() : "";
  return (TYPES as readonly string[]).includes(t) ? (t as NetworkType) : "unknown";
};
export const toBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
