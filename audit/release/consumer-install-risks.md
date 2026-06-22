# PLRNUI-8 - Consumer Install Risks

## Scope

Audit of clean Expo/React Native consumer installation, import feasibility, package dependency graph, duplicate React/RN risk, Metro risk and TypeScript resolution risk.

The consumer app was created only under `/tmp/plrnui8-consumer`. No repository source, package metadata, lockfile or config was modified.

## Evidence

Temporary package artifact:

- Built and packed from `/tmp/plrnui8-validation.SC3SJW/repo`.
- Tarball: `/tmp/plrnui8-validation.SC3SJW/repo/aura-ui-1.0.0.tgz`.

Temporary consumer app:

- Created with `npx create-expo-app@latest /tmp/plrnui8-consumer --template blank-typescript --yes`.
- Created app dependencies:
  - `expo: ~56.0.12`
  - `expo-status-bar: ~56.0.4`
  - `react: 19.2.3`
  - `react-native: 0.85.3`
  - `typescript: ~6.0.3`
- Creation emitted `EBADENGINE` warnings because several React Native/Metro packages require Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`, while the environment has Node `v20.19.2`.
- App creation still completed successfully.
- Clean install of the package tarball failed.

Install failure:

```text
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: react@19.2.3
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^19.2.4" from @aura/ui@1.0.0
```

Consumer dependency tree before package install:

```text
plrnui8-consumer@1.0.0 /tmp/plrnui8-consumer
├── react-native@0.85.3
└── react@19.2.3
```

Package dependency evidence from `package.json`:

| Section | Packages |
| --- | --- |
| `peerDependencies` | `react` |
| `dependencies` | `@react-native-async-storage/async-storage`, `expo-clipboard`, `lucide-react`, `lucide-react-native`, `react-dom`, `react-native`, `react-native-safe-area-context`, `react-native-svg`, `react-native-web`, `tsup`, `typescript`, `ui` |
| `devDependencies` | `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `vite` |

## Commands Executed

```bash
npm_config_cache=/tmp/plrnui8-npm-cache npx create-expo-app@latest --version
npx create-expo-app@latest /tmp/plrnui8-consumer --template blank-typescript --yes
npm install /tmp/plrnui8-validation.SC3SJW/repo/aura-ui-1.0.0.tgz
npm_config_cache=/tmp/plrnui8-npm-cache npm install /tmp/plrnui8-validation.SC3SJW/repo/aura-ui-1.0.0.tgz
sed -n '1,240p' package.json
npm_config_cache=/tmp/plrnui8-npm-cache npm ls react react-native --depth=0
npm_config_cache=/tmp/plrnui8-npm-cache npm ls expo --depth=0
```

## Findings

- A real clean Expo TypeScript app could be created in `/tmp`.
- The clean consumer could not install `@aura/ui@1.0.0` because the package peer requires `react@^19.2.4` and the generated Expo app uses `react@19.2.3`.
- Root import, TypeScript import and Metro runtime validation could not proceed because package installation failed.
- React Native is currently declared in `dependencies`, not `peerDependencies`, creating duplicate RN risk if install is forced.
- Build tools `tsup` and `typescript` are declared in `dependencies`, increasing consumer install surface.
- Native/runtime packages are hard dependencies, including AsyncStorage, Expo Clipboard, Safe Area, SVG and icon packages.
- Preview web config uses local aliases/shims for native modules and is not proof of clean Metro compatibility.

## Risks

- Duplicate React risk is immediate: strict npm resolution blocks install due React peer mismatch.
- Duplicate React Native risk remains unresolved because `react-native` is a package dependency.
- Metro cannot be validated until clean install succeeds.
- TypeScript declaration resolution cannot be validated in the consumer until clean install succeeds.
- Expo compatibility is unproven because install fails before native runtime checks.
- Forcing install with `--legacy-peer-deps` or `--force` would invalidate the clean consumer evidence required by PLRNUI-8.

## Blockers

- Clean Expo consumer install fails with `ERESOLVE` on React peer range.
- `react-native` is still a runtime dependency instead of an app-owned peer.
- Native dependencies are hard runtime dependencies without implemented peer/optional peer policy.
- Consumer root import, Metro resolution and TypeScript resolution remain blocked by install failure.

## Conclusion

The package is not currently consumable by a clean Expo app under strict npm dependency resolution. The first blocking failure is the React peer range mismatch, followed by unresolved React Native duplication and native dependency policy risks in package metadata.
