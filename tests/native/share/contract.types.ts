// Typed usage compiled by tsconfig.tests.json. The modules are declared locally: react-native is not imported.
import { createNoopShare, createReactNativeShare, createWebShare, useShare } from "../../../src/native/share/index.js";
import type { ShareAdapter, ShareResult, ShareState } from "../../../src/native/share/index.js";

declare const Share: Parameters<typeof createReactNativeShare>[0];

export const rn: ShareAdapter = createReactNativeShare(Share);
export const web: ShareAdapter = createWebShare(globalThis.navigator as never, { onUnsupported: async ({ url }) => void url });
export const noop: ShareAdapter = createNoopShare();
export const hook: () => ShareState = () => useShare({ adapter: rn });
export const run = async (): Promise<ShareResult["action"]> => (await rn.share({ message: "Hi", url: "https://example.com", title: "T" })).action;
