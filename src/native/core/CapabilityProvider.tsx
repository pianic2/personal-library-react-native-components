import React, { createContext, useContext, useMemo } from "react";
import { coreFallback } from "./fallbacks.js";
import { createNoopAdapters } from "./noop.js";
import type { AdapterFor, CapabilityAdapters, CapabilityId, CapabilityRegistry, CapabilityStatus } from "./types.js";

interface Resolution {
  adapters: CapabilityAdapters;
  registry?: CapabilityRegistry;
}

const Context = createContext<Resolution>({ adapters: {} });
const noopAdapters = createNoopAdapters();

export interface CapabilityProviderProps {
  /**
   * Adapters for this subtree. A provider overrides an outer provider per id and inherits the other ids; an `undefined`
   * entry is ignored. Hoist or memoize this object: a new object on every render re-renders every consumer.
   */
  adapters?: CapabilityAdapters;
  /** Default adapters, used for ids no provider supplies. The nearest registry wins. */
  registry?: CapabilityRegistry;
  children?: React.ReactNode;
}

export function CapabilityProvider({ adapters, registry, children }: CapabilityProviderProps) {
  const parent = useContext(Context);
  const value = useMemo<Resolution>(() => {
    const merged: Record<string, unknown> = { ...parent.adapters };
    for (const [id, adapter] of Object.entries(adapters ?? {})) if (adapter !== undefined) merged[id] = adapter;
    return { adapters: merged as CapabilityAdapters, registry: registry ?? parent.registry };
  }, [parent, adapters, registry]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * Resolves a capability: provider adapter, then registry default, then the React Native core fallback, then a noop
 * adapter. It never throws and works with no provider and no optional package installed.
 */
export function useCapability<K extends CapabilityId>(id: K): AdapterFor<K> {
  const { adapters, registry } = useContext(Context);
  return (adapters[id] ?? registry?.get(id) ?? coreFallback(id) ?? noopAdapters[id]) as AdapterFor<K>;
}

export function useCapabilityStatus(id: CapabilityId): CapabilityStatus {
  return useCapability(id).status;
}
