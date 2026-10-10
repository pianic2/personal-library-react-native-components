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

function normalizeOs(value: string | null | undefined): PlatformOs {
  const lower = typeof value === "string" ? value.toLowerCase() : "";
  if (lower === "ipados") return "ios";
  return (OS_VALUES as readonly string[]).includes(lower) ? (lower as PlatformOs) : "unknown";
}

function pick<T>(override: T | null | undefined, core: T): T {
  return override === undefined || override === null ? core : override;
}

/**
 * Builds PlatformInfo. Core fields come from React Native `Platform` and are always filled; enriched fields
 * (isEmulator, isExpoGo, hasNotch) are null without an adapter. An adapter overrides a core field only when it
 * provides a non-null value. Never throws.
 */
export function getPlatformInfo(adapter?: DeviceInfoAdapter | null, source: PlatformSource = Platform): PlatformInfo {
  const coreOs = normalizeOs(source.OS);
  const coreVersion = source.Version === undefined || source.Version === null ? null : String(source.Version);
  const coreTablet = coreOs === "ios" && source.isPad === true;

  const os = adapter?.os ? normalizeOs(adapter.os) : coreOs;
  return {
    os,
    osVersion: pick(adapter?.osVersion, coreVersion),
    isTablet: pick(adapter?.isTablet, coreTablet),
    isEmulator: pick<boolean | null>(adapter?.isEmulator, null),
    isExpoGo: pick<boolean | null>(adapter?.isExpoGo, null),
    isWeb: os === "web",
    hasNotch: pick<boolean | null>(adapter?.hasNotch, null),
  };
}

/** Hook form of getPlatformInfo. Memoize or hoist `adapter` so the result stays stable. */
export function usePlatformInfo(adapter?: DeviceInfoAdapter | null): PlatformInfo {
  return useMemo(() => getPlatformInfo(adapter), [adapter]);
}

/**
 * Builds a DeviceInfoAdapter from modules the app imports itself (this package never imports expo-*):
 * `createExpoDeviceInfoAdapter({ device: ExpoDevice, constants: ExpoConstants })`. Either module may be omitted.
 */
export function createExpoDeviceInfoAdapter(modules: {
  device?: ExpoDeviceModuleLike | null;
  constants?: ExpoConstantsModuleLike | null;
}): DeviceInfoAdapter {
  const { device, constants } = modules;
  const adapter: DeviceInfoAdapter = {};
  if (device) {
    if (device.osName) adapter.os = normalizeOs(device.osName);
    if (device.osVersion) adapter.osVersion = device.osVersion;
    if (typeof device.isDevice === "boolean") adapter.isEmulator = !device.isDevice;
    if (typeof device.deviceType === "number" && device.deviceType !== 0) adapter.isTablet = device.deviceType === 2;
  }
  if (constants) {
    const env = constants.executionEnvironment;
    const owner = constants.appOwnership;
    if (typeof env === "string") adapter.isExpoGo = env === "storeClient";
    else if (typeof owner === "string") adapter.isExpoGo = owner === "expo";
  }
  return adapter;
}
