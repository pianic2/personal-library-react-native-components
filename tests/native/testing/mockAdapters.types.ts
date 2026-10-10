// Type-level exhaustiveness (PLRNUI-146). `expectedIds` must list exactly the CapabilityMap keys: a new key (missing)
// or a removed key (excess) fails to compile here, and the runtime test compares the mocks against this list.
import type { CapabilityId } from "../../../src/native/core/index.js";
import { createMockAdapters } from "../../../src/native/testing/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export const expectedIds = {
  clipboard: true,
  haptics: true,
  share: true,
  storage: true,
  biometric: true,
  network: true,
  appState: true,
} as const satisfies Record<CapabilityId, true>;

export type IdsMatch = Expect<Equal<keyof typeof expectedIds, CapabilityId>>;

// Every id has a mock whose api is the CapabilityMap api (assignability per id).
type Mocks = ReturnType<typeof createMockAdapters>["adapters"];
export type MocksCoverEveryId = Expect<Equal<CapabilityId extends keyof Mocks ? true : false, true>>;

// @ts-expect-error overrides are typed per capability
createMockAdapters({ clipboard: { getString: async () => 1 } });
// @ts-expect-error unknown capability id
createMockAdapters({ camera: {} });
