import React, { createContext, useContext, useMemo } from "react";
import type { PermissionAdapters } from "./types.js";

const Context = createContext<PermissionAdapters>({});

export interface PermissionsProviderProps {
  /** One adapter per kind. A nested provider overrides an outer one per kind and inherits the rest. Hoist or memoize it. */
  adapters?: PermissionAdapters;
  children?: React.ReactNode;
}

/** Registers permission adapters for the subtree (capability "permissions", one adapter per kind). */
export function PermissionsProvider({ adapters, children }: PermissionsProviderProps) {
  const parent = useContext(Context);
  const value = useMemo<PermissionAdapters>(() => {
    const merged: Record<string, unknown> = { ...parent };
    for (const [kind, adapter] of Object.entries(adapters ?? {})) if (adapter !== undefined) merged[kind] = adapter;
    return merged as PermissionAdapters;
  }, [parent, adapters]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePermissionAdapters(): PermissionAdapters {
  return useContext(Context);
}
