import { noopApi } from "./noop.js";
import type { AdapterFor, CapabilityId, CapabilityMap } from "./types.js";

/**
 * Describes how an Expo (or any external) module becomes the api of a capability. The module is passed in by the
 * caller (injection): this package never imports it and never calls `require`. `Module` is a structural type that lists
 * only the members the factory uses, so no Expo type is needed.
 *
 * The returned factory yields an `available` adapter when it receives the module and an `unavailable` adapter (with a
 * noop api) when the module is missing or the factory throws. It never throws.
 */
export function defineExpoAdapter<K extends CapabilityId, Module>(id: K, create: (module: Module) => CapabilityMap[K]) {
  return (module?: Module | null): AdapterFor<K> => {
    if (module != null) {
      try {
        return { id, status: "available", api: create(module) };
      } catch {
        // fall through to unavailable
      }
    }
    return { id, status: "unavailable", api: noopApi(id) };
  };
}
