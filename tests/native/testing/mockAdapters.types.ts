// Type-level exhaustiveness (PLRNUI-146): every CapabilityMap key has a mock adapter of the matching type.
import type { AdapterFor, CapabilityId } from "../../../src/native/core/index.js";
import { createMockAdapters } from "../../../src/native/testing/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Mocks = ReturnType<typeof createMockAdapters>["adapters"];
export type Exhaustive = Expect<Equal<keyof Mocks, CapabilityId>>;
export type Typed = Expect<Equal<Mocks["clipboard"], AdapterFor<"clipboard">>>;

// @ts-expect-error overrides are typed per capability
createMockAdapters({ clipboard: { getString: async () => 1 } });
// @ts-expect-error unknown capability id
createMockAdapters({ camera: {} });
