// Typed usage of the app-state hooks (PLRNUI-172). Compiled by `tsc -p tsconfig.tests.json`.
import { useAppState, useIsAppActive, useOnBackground, useOnForeground } from "../../../src/native/app-state/index.js";
import type { AppStateApi, AppStateValue } from "../../../src/native/core/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type UseAppStateSig = Expect<Equal<typeof useAppState, () => AppStateValue>>;
export type UseIsAppActiveSig = Expect<Equal<typeof useIsAppActive, () => boolean>>;
export type UseOnForegroundSig = Expect<Equal<typeof useOnForeground, (callback: () => void) => void>>;
export type UseOnBackgroundSig = Expect<Equal<typeof useOnBackground, (callback: () => void) => void>>;
export type AppStateValueIds = Expect<Equal<AppStateValue, "active" | "background" | "inactive">>;
export type AppStateApiShape = Expect<
  Equal<AppStateApi, { getState(): AppStateValue; subscribe(listener: (state: AppStateValue) => void): () => void }>
>;

export function usage() {
  const state: AppStateValue = useAppState();
  const active: boolean = useIsAppActive();
  useOnForeground(() => void state);
  useOnBackground(() => void active);
  // @ts-expect-error the callback takes no argument
  useOnForeground((s: AppStateValue) => s);
}
