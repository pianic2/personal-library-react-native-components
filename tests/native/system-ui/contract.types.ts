// Typed usage compiled by tsconfig.tests.json. The modules are declared locally: expo-system-ui and expo-navigation-bar are not imported.
import { ThemedStatusBar, createExpoSystemUi, createNoopSystemUi, createWebSystemUi, resolveWebSystemUi, useSystemBars } from "../../../src/native/system-ui/index.js";
import type { SystemBarsConfig, SystemUiAdapter } from "../../../src/native/system-ui/index.js";

declare const SystemUI: { setBackgroundColorAsync(color: string): Promise<boolean> };
declare const NavigationBar: { setBackgroundColorAsync(color: string): Promise<void>; setButtonStyleAsync(style: "light" | "dark"): Promise<void> };

export const adapter: SystemUiAdapter = createExpoSystemUi({ systemUi: SystemUI, navigationBar: NavigationBar });
export const noop: SystemUiAdapter = createNoopSystemUi();
export const web: SystemUiAdapter | undefined = resolveWebSystemUi();
export const webFromDocument = createWebSystemUi(document);
export const config: SystemBarsConfig = { mode: "dark", backgroundColor: "#000000" };
export const hook = () => useSystemBars({ mode: "dark", backgroundColor: "#000000", adapter });
export const component = ThemedStatusBar;
