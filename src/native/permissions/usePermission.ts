import { useCallback, useEffect, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { useOnForeground } from "../app-state/hooks.js";
import { usePermissionAdapters } from "./PermissionsProvider.js";
import type { PermissionAdapter, PermissionControls, PermissionKind, PermissionResult, PermissionState } from "./types.js";

const UNAVAILABLE: PermissionResult = { status: "unavailable", canAskAgain: false };
const UNDETERMINED: PermissionResult = { status: "undetermined", canAskAgain: true };

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

// State is keyed by the adapter it belongs to: when the kind or its adapter changes, the first render already shows the
// new adapter's initial state instead of the previous one's.
interface Slot {
  adapter: PermissionAdapter | undefined;
  result: PermissionResult;
  checking: boolean;
  requesting: boolean;
}

const initialSlot = (adapter: PermissionAdapter | undefined): Slot => ({
  adapter,
  result: adapter ? UNDETERMINED : UNAVAILABLE,
  checking: adapter !== undefined,
  requesting: false,
});

/**
 * Status and controls for one permission kind. Checks on mount and again whenever the app returns to the foreground
 * (the user may have changed it in settings). A kind with no registered adapter is `unavailable` and `request()`
 * resolves `unavailable` without prompting. A failing adapter keeps the last known status and never throws. A foreground
 * re-check never overrides a pending `request()`: the request's answer is always the last word.
 */
export function usePermission(kind: PermissionKind): PermissionControls {
  const adapter: PermissionAdapter | undefined = usePermissionAdapters()[kind];
  const [slot, setSlot] = useState<Slot>(() => initialSlot(adapter));
  const view = slot.adapter === adapter ? slot : initialSlot(adapter);

  const mounted = useRef(true);
  const generation = useRef(0);
  const requesting = useRef(false);
  const current = useRef({ adapter, status: view.result.status });
  current.current = { adapter, status: view.result.status };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Applies `change` to the slot of `target` only (an update for an adapter that is no longer current is dropped).
  const update = useCallback((target: PermissionAdapter | undefined, change: (slot: Slot) => Partial<Slot>) => {
    if (!mounted.current || current.current.adapter !== target) return;
    setSlot((prev) => {
      const base = prev.adapter === target ? prev : initialSlot(target);
      return { ...base, ...change(base) };
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!adapter) {
      update(adapter, () => ({ result: UNAVAILABLE, checking: false }));
      return;
    }
    if (requesting.current) return;
    const id = ++generation.current;
    update(adapter, () => ({}));
    try {
      const next = normalise(await adapter.check());
      if (id === generation.current && !requesting.current) update(adapter, () => ({ result: next }));
    } catch {
      // keep the last known status
    } finally {
      if (id === generation.current) update(adapter, () => ({ checking: false }));
    }
  }, [adapter, update]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useOnForeground(() => {
    void refresh();
  });

  const request = useCallback(async (): Promise<PermissionState> => {
    if (!adapter) return "unavailable";
    requesting.current = true;
    generation.current += 1; // invalidates any check still in flight
    update(adapter, () => ({ requesting: true }));
    try {
      const next = normalise(await adapter.request());
      update(adapter, () => ({ result: next }));
      return next.status;
    } catch {
      return current.current.status;
    } finally {
      requesting.current = false;
      update(adapter, () => ({ requesting: false, checking: false }));
    }
  }, [adapter, update]);

  const openSettings = useCallback(async (): Promise<void> => {
    try {
      if (adapter?.openSettings) await adapter.openSettings();
      else await openSystemSettings();
    } catch {
      // opening settings is best effort
    }
  }, [adapter]);

  return {
    status: view.result.status,
    canAskAgain: view.result.canAskAgain,
    isLoading: view.checking || view.requesting,
    request,
    openSettings,
  };
}
