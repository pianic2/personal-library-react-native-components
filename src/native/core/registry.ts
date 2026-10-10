import type { CapabilityAdapters, CapabilityId, CapabilityRegistry } from "./types.js";

/** A mutable set of default adapters, consulted after the adapters given to a provider. It is read at render time. */
export function createCapabilityRegistry(defaults: CapabilityAdapters = {}): CapabilityRegistry {
  const adapters = new Map<string, unknown>(Object.entries(defaults));
  return {
    get: ((id: CapabilityId) => adapters.get(id)) as CapabilityRegistry["get"],
    set: ((id: CapabilityId, adapter: unknown) => void adapters.set(id, adapter)) as CapabilityRegistry["set"],
  };
}
