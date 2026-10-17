# Share (`native/share`)

One typed call for the system share sheet over an injected React Native `Share` or a web `navigator`. Reached through the `./native` subpath once the export contract wires it; never from the root entry. This folder imports no native package, adds no dependency, and needs no Expo package (`expo-sharing` is intentionally excluded: file sharing is not covered and stays consumer-owned).

## API

```ts
type ShareContent = { message?: string; url?: string; title?: string }; // at least a message or a url
type ShareResult = { action: "shared" | "dismissed" | "unsupported" };
interface ShareAdapter { share(content: ShareContent): Promise<ShareResult> } // never rejects
```

- `createReactNativeShare(Share)`: `dismissedAction` is `dismissed`, `sharedAction` is `shared`. Empty content, a rejection or an unknown action is `unsupported`. `title` becomes the Android `dialogTitle`.
- `createWebShare(navigator, { onUnsupported })`: a resolved `navigator.share` is `shared`, an `AbortError` is `dismissed`; a missing `navigator.share`, another rejection or empty content is `unsupported` and never throws. When `navigator.share` is missing, `onUnsupported(content)` runs first so the app can copy the link; the result stays `unsupported` because no sheet was shown.
- `createNoopShare()`: always `unsupported`.
- `useShare({ adapter })`: `{ share, pending, result }`. Without an adapter it uses the noop one.

```ts
import { Share } from "react-native"; // in the app, not in this package
const adapter = createReactNativeShare(Share); // on web: createWebShare(globalThis.navigator, { onUnsupported: copyLink })
const { share, pending } = useShare({ adapter }); // memoize or hoist `adapter`
const { action } = await share({ message: "Read this", url: "https://example.com" });
```

## Fallbacks

With no adapter configured nothing is shown and the result is `unsupported`. On web, `navigator.share` exists only on secure origins in browsers that implement it.

Semver impact: minor (new subpath API). The migration-changelog entry belongs to the ticket that owns `audit/migration/migration-changelog.md`.
