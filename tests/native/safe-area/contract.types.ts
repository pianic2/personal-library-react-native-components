// Typed usage compiled by tsconfig.tests.json. The module is declared locally: nothing is imported from a native package.
import { SafeAreaBox, SafeAreaInsetsProvider, createSafeAreaContextAdapter, useInsets } from "../../../src/native/safe-area/index.js";
import type { Insets } from "../../../src/native/safe-area/index.js";

declare const SafeAreaContext: { useSafeAreaInsets(): Insets };

export const adapter = createSafeAreaContextAdapter(SafeAreaContext);
export const insets: () => Insets = () => useInsets();
export const shell = () => SafeAreaInsetsProvider({ adapter, children: SafeAreaBox({ edges: ["top"] }) });
