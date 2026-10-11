// Type-level contract of the capability layer (PLRNUI-138). Compiled by `tsc -p tsconfig.tests.json` (the runtime test
// imports this file); the @ts-expect-error lines must keep failing to compile.
import type { AdapterFor, CapabilityAdapters, CapabilityId, CapabilityMap } from "../../../src/native/core/index.js";
import { createCapabilityRegistry, defineExpoAdapter, useCapability, useCapabilityStatus } from "../../../src/native/core/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type ClosedIds = Expect<Equal<CapabilityId, "clipboard" | "haptics" | "share" | "storage" | "biometric" | "network" | "appState" | "accessibility">>;
export type ApiOfClipboard = Expect<Equal<AdapterFor<"clipboard">["api"], CapabilityMap["clipboard"]>>;

export function usage() {
  const clipboard = useCapability("clipboard");
  void clipboard.api.setString("x");
  const status: "available" | "unavailable" | "noop" = useCapabilityStatus("haptics");
  void status;
  // @ts-expect-error unknown capability id
  useCapability("camera");
  // @ts-expect-error unknown capability id
  useCapabilityStatus("camera");
  // @ts-expect-error the api of another capability is not accepted
  const wrong: CapabilityAdapters = { clipboard: { id: "clipboard", status: "noop", api: { impact: async () => undefined } } };
  void wrong;
  // @ts-expect-error unknown capability id in a registry
  createCapabilityRegistry().get("camera");
  // @ts-expect-error unknown capability id in defineExpoAdapter
  defineExpoAdapter("camera", () => ({}));
}

export const clipboardFactory = defineExpoAdapter<"clipboard", { getStringAsync(): Promise<string>; setStringAsync(v: string): Promise<unknown> }>(
  "clipboard",
  (m) => ({ getString: () => m.getStringAsync(), setString: async (v) => void (await m.setStringAsync(v)) })
);
