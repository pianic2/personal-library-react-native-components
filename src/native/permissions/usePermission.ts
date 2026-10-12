import { useCallback, useEffect, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { useOnForeground } from "../app-state/hooks.js";
import { usePermissionAdapters } from "./PermissionsProvider.js";
import type { PermissionAdapter, PermissionControls, PermissionKind, PermissionResult, PermissionState } from "./types.js";

const UNAVAILABLE: PermissionResult = { status: "unavailable", canAskAgain: false };

function normalise(result: PermissionResult | null | undefined): PermissionResult {
  if (!result || typeof result.status !== "string") return UNAVAILABLE;
  return { status: result.status, canAskAgain: result.canAskAgain !== false && result.status !== "blocked" && result.status !== "unavailable" };
}

interface LinkingLike {
  openSettings?: () => Promise<void>;
}

async function openSystemSettings(): Promise<void> {
  const linking = (ReactNative as unknown as { Linking?: LinkingLike }).Linking;
  if (typeof linking?.openSettings === "function") await linking.openSettings();
}

/**
 * Status and controls for one permission kind. Checks on mount and again whenever the app returns to the foreground
 * (the user may have changed it in settings). A kind with no registered adapter is `unavailable` and `request()`
 * resolves `unavailable` without prompting. A failing adapter keeps the last known status and never throws.
 */
export function usePermission(kind: PermissionKind): PermissionControls {
  const adapter: PermissionAdapter | undefined = usePermissionAdapters()[kind];
  const [result, setResult] = useState<PermissionResult>(adapter ? { status: "undetermined", canAskAgain: true } : UNAVAILABLE);
  const [loading, setLoading] = useState<boolean>(adapter !== undefined);
  const generation = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const id = ++generation.current;
    if (!adapter) {
      setResult(UNAVAILABLE);
      setLoading(false);
      return;
    }
    try {
      const next = normalise(await adapter.check());
      if (mounted.current && id === generation.current) setResult(next);
    } catch {
      // keep the last known status
    } finally {
      if (mounted.current && id === generation.current) setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    setLoading(adapter !== undefined);
    void refresh();
  }, [refresh, adapter]);

  useOnForeground(() => {
    void refresh();
  });

  const request = useCallback(async (): Promise<PermissionState> => {
    if (!adapter) return "unavailable";
    const id = ++generation.current;
    if (mounted.current) setLoading(true);
    try {
      const next = normalise(await adapter.request());
      if (mounted.current && id === generation.current) setResult(next);
      return next.status;
    } catch {
      return result.status;
    } finally {
      if (mounted.current && id === generation.current) setLoading(false);
    }
  }, [adapter, result.status]);

  const openSettings = useCallback(async (): Promise<void> => {
    try {
      if (adapter?.openSettings) await adapter.openSettings();
      else await openSystemSettings();
    } catch {
      // opening settings is best effort
    }
  }, [adapter]);

  return { status: result.status, canAskAgain: result.canAskAgain, isLoading: loading, request, openSettings };
}
