# Motion Dependency Strategy

- Jira: PLRNUI-127 (E3-02)
- Decision record: `audit/adr/0012-motion-engine-and-optional-peers.md`
- Status: follows ADR 0012; owner sign-off is recorded in the ADR.

## Decision summary

Core motion uses React Native built-ins only: `Animated` (native driver where supported), `LayoutAnimation` and `PanResponder`. No package in this document is added to `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies` or `devDependencies` of the core package. `peerDependencies` stay `react` and `react-native`.

## Candidates

| Package | Role | Core decision | Section if ever adopted | Native / autolinking |
| --- | --- | --- | --- | --- |
| `react-native` (`Animated`, `LayoutAnimation`, `PanResponder`) | Core engine | Use | Existing peer | Host runtime, already a peer |
| `react-native-reanimated` | Worklet based animation | Not a core peer; only behind a `MotionEngine` adapter in a separate entry point after a future ADR | Consumer-owned | Native module; the Babel plugin is added by `babel-preset-expo` in managed Expo apps, Reanimated 4 also needs the worklets plugin and the New Architecture |
| `react-native-gesture-handler` | Gesture recognition | Not a core peer; same rule as Reanimated | Consumer-owned | Native module, wrapper root view required |
| `expo-haptics` (or any haptics package) | Haptic feedback | Adapter contract in core, implementation owned by the consumer | Consumer-owned | Expo native module |

## Environment impact

| Package | Expo Go | Managed workflow | Prebuild / dev client | Bare RN | Web (react-native-web) |
| --- | --- | --- | --- | --- | --- |
| `Animated`, `LayoutAnimation`, `PanResponder` | Works | Works | Works | Works | `Animated` and `PanResponder` work; `LayoutAnimation` is a no-op or limited, features must degrade gracefully |
| `react-native-reanimated` | Works only with the version bundled in the Expo Go SDK; a different version needs a dev client | Works with the SDK-matched version and the Babel plugin | Works, config via plugin | Works after native install and Babel plugin | Supported with extra setup |
| `react-native-gesture-handler` | Works with the SDK-bundled version | Works with the SDK-matched version | Works | Works after native install | Supported |
| `expo-haptics` | Works | Works | Works | Needs the Expo modules setup | No effect (no-op) |

Expo SDK specific cells are not verified by this ticket (status: supported or conditional, unverified until the PLRNUI-46 smoke scenario covers them). On web, `useNativeDriver` is not available and `Animated` uses the JS driver.

## Gate register rows (native-dependency-gate.md approval checklist)

None of these packages is adopted by this ADR, so none is added to any package section and none blocks release. If a package is adopted later, its row is completed (version, smoke result) by the adopting ticket and the release-blocker status is set per the gate.

| Package | Version / range | Package section | Jira | Source usage | Native status | Autolinking | Expo Go | Managed | Prebuild / dev client | Config plugin | Consumer impact | Alternative | ADR | Risk assessment | Breaking-change register | Smoke scenario (PLRNUI-46) | Release blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `react-native-reanimated` | Not adopted; SDK-matched when adopted | None (consumer-owned) | PLRNUI-127 | None in core; future `MotionEngine` adapter entry point | Native, Babel/worklets plugin | Yes | Supported with the SDK-bundled version only (unverified) | Supported with the SDK-matched version (unverified) | Possible | Babel plugin, not an Expo config plugin | None for core consumers | `Animated` (chosen) | Required before adoption (future ADR) | Required before adoption (high blast radius) | Not required while not adopted | `motion-adapter-reanimated` (to be created with the adapter ADR) | No: not adopted |
| `react-native-gesture-handler` | Not adopted; SDK-matched when adopted | None (consumer-owned) | PLRNUI-127 | None in core | Native | Yes | Supported with the SDK-bundled version only (unverified) | Supported with the SDK-matched version (unverified) | Possible | None | None for core consumers | `PanResponder` (chosen) | Required before adoption (future ADR) | Required before adoption | Not required while not adopted | `motion-adapter-gesture-handler` (to be created with the adapter ADR) | No: not adopted |
| `expo-haptics` | Consumer-chosen, SDK-matched | None (consumer-owned adapter backend) | PLRNUI-127 | None in core; consumer passes an adapter | Expo module | Yes (Expo modules) | Supported (unverified) | Supported (unverified) | Not required | None | None for core consumers | No haptics when no adapter | Covered by ADR 0012 (adapter, consumer-owned) | Not required: additive adapter contract, no core dependency | Not required: no consumer change | `haptics-adapter-contract` (added when the haptics hook is implemented) | No: not adopted |

The shared `native-dependency-register.md` is outside this ticket's files and still needs these rows when a package is adopted.

## Rules for dependent tickets

- Do not add any package above to the core package metadata or to code reachable from the root entry.
- Every animation honors the reduced-motion preference.
- Haptics APIs take an optional adapter; the absence of an adapter is a silent no-op.
- Adding the `MotionEngine` adapter entry point requires a new ADR and a Jira ticket per `native-dependency-gate.md`.
