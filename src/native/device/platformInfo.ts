import { useMemo } from "react";
import { Platform } from "react-native";
import type {
  DeviceInfoAdapter,
  ExpoConstantsModuleLike,
  ExpoDeviceModuleLike,
  PlatformInfo,
  PlatformOs,
  PlatformSource,
} from "./types.js";

const OS_VALUES: readonly PlatformOs[] = ["ios", "android", "web", "windows", "macos"];

/** Reads through a getter that may throw (injected modules, Platform). A throw degrades to undefined. */
function safe<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

/** A recognised OS or null. Never returns "unknown", so an unrecognised value can not override a real one. */
function parseOs(value: unknown): Exclude<PlatformOs, "unknown"> | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase();
  if (lower === "ipados") return "ios";
  return (OS_VALUES as readonly string[]).includes(lower) ? (lower as Exclude<PlatformOs, "unknown">) : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

// Web tablet default: the ticket says "userAgent-based isTablet false default", read as: derive from the user agent
// when one is available, otherwise false. Desktop-class iPadOS ("Macintosh" UA) is deliberately not guessed.
function webTabletFromUserAgent(userAgent: unknown): boolean {
  if (typeof userAgent !== "string") return false;
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return true;
  return /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
}

function defaultSource(): PlatformSource {
  return {
    OS: safe(() => Platform.OS) as string,
    Version: safe(() => Platform.Version),
    isPad: safe(() => (Platform as { isPad?: boolean }).isPad),
    userAgent: safe(() => (typeof navigator !== "undefined" ? navigator.userAgent : undefined)),
  };
}

/**
 * Builds PlatformInfo. Core fields come from React Native `Platform` and are always filled; enriched fields
 * (isEmulator, isExpoGo, hasNotch) are null without an adapter. An adapter overrides a core field only when it
 * provides a usable value (a recognised os, a non-empty osVersion, a boolean). Every read of `Platform` or of the
 * adapter is guarded, so this never throws; an unreadable field degrades to unknown/null.
 */
export function getPlatformInfo(adapter?: DeviceInfoAdapter | null, source?: PlatformSource): PlatformInfo {
  const src = source ?? defaultSource();
  const coreOs: PlatformOs = parseOs(safe(() => src.OS)) ?? "unknown";
  const rawVersion = safe(() => src.Version);
  const coreVersion = rawVersion === undefined || rawVersion === null ? null : nonEmptyString(String(rawVersion));

  const os: PlatformOs = parseOs(safe(() => adapter?.os)) ?? coreOs;
  const isWeb = os === "web";

  let isTablet: boolean;
  if (isWeb) {
    isTablet = webTabletFromUserAgent(safe(() => src.userAgent)); // adapter isTablet is ignored on web
  } else {
    isTablet = boolOrNull(safe(() => adapter?.isTablet)) ?? (os === "ios" && safe(() => src.isPad) === true);
  }

  return {
    os,
    osVersion: nonEmptyString(safe(() => adapter?.osVersion)) ?? coreVersion,
    isTablet,
    isEmulator: boolOrNull(safe(() => adapter?.isEmulator)),
    isExpoGo: boolOrNull(safe(() => adapter?.isExpoGo)),
    isWeb,
    hasNotch: boolOrNull(safe(() => adapter?.hasNotch)),
  };
}

/** Hook form of getPlatformInfo. Memoize or hoist `adapter` so the result stays stable. */
export function usePlatformInfo(adapter?: DeviceInfoAdapter | null): PlatformInfo {
  return useMemo(() => getPlatformInfo(adapter), [adapter]);
}

/**
 * Builds a DeviceInfoAdapter from modules the app imports itself (this package never imports expo-*):
 * `createExpoDeviceInfoAdapter({ device: ExpoDevice, constants: ExpoConstants })`. Either module may be omitted.
 * Every read is guarded: a throwing getter just leaves that field out.
 */
export function createExpoDeviceInfoAdapter(modules: {
  device?: ExpoDeviceModuleLike | null;
  constants?: ExpoConstantsModuleLike | null;
}): DeviceInfoAdapter {
  const device = safe(() => modules?.device);
  const constants = safe(() => modules?.constants);
  const adapter: DeviceInfoAdapter = {};
  if (device) {
    const os = parseOs(safe(() => device.osName));
    if (os) adapter.os = os;
    const version = nonEmptyString(safe(() => device.osVersion));
    if (version) adapter.osVersion = version;
    const isDevice = safe(() => device.isDevice);
    if (typeof isDevice === "boolean") adapter.isEmulator = !isDevice;
    const deviceType = safe(() => device.deviceType);
    if (typeof deviceType === "number" && deviceType !== 0) adapter.isTablet = deviceType === 2;
  }
  if (constants) {
    const env = safe(() => constants.executionEnvironment);
    const owner = safe(() => constants.appOwnership);
    if (typeof env === "string") adapter.isExpoGo = env === "storeClient";
    else if (typeof owner === "string") adapter.isExpoGo = owner === "expo";
  }
  return adapter;
}
