# PLRNUI-36 - Package Dependency Realignment

## Repository state

| Item | Value |
| --- | --- |
| Repository path | `/home/optimus/Documenti/GitHub/personal-library-react-native-components` |
| Branch | `main` |
| Initial git status | Clean; `git status --short` returned no output. |
| Node | `v20.19.2` |
| npm | `9.2.0` |

## Evidence read before edits

- `audit/dependencies/dependency-classification.md`
- `audit/dependencies/peer-dependency-policy.md`
- `audit/dependencies/native-dependency-register.md`
- `audit/release/package-validation.md`
- `audit/release/consumer-install-risks.md`
- `audit/release/release-readiness-report.md`

## Files modified

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `.node-version`
- `audit/release/package-dependency-realignment.md`

## Runtime baseline follow-up

PLRNUI-36 follow-up raised the runtime baseline to Node 22:

| File | Value |
| --- | --- |
| `.nvmrc` | `22` |
| `.node-version` | `22` |
| `package.json` `engines.node` | `>=22` |

Verification used a temporary Node 22 runtime from npm because the host shell still reports `/usr/bin/node` as `v20.19.2`. The verification runtime was `node@22.23.0`.

## Dependency diff

### Moved to `peerDependencies`

| Package | Range | Reason |
| --- | --- | --- |
| `react` | `>=19.2.3 <20.0.0` | Host React runtime owned by the consumer. Range is aligned by PLRNUI-42 to the selected latest stable Expo baseline: Expo SDK `56.0.0`, React Native `0.85`, React `19.2.3`. |
| `react-native` | `>=0.85.0 <0.86.0` | Host React Native runtime owned by the consumer. Range includes the clean Expo consumer baseline observed during smoke validation: `react-native@0.85.3`. |

### Moved to `devDependencies`

No package was moved during PLRNUI-36. The current package metadata already had `typescript` in `devDependencies` before this task.

### Remaining in `dependencies`

No package remains in `dependencies`. The current published source only exports `PACKAGE_NAME` from `src/index.ts`; no runtime JS dependency is required by current source evidence.

### Native, Expo and web packages not added

The following packages were intentionally not added in PLRNUI-36 because the current source tree does not import them and the task explicitly defers specific decisions to follow-up tickets:

| Package | Decision |
| --- | --- |
| `react-native-safe-area-context` | Not added; safe-area policy remains follow-up for PLRNUI-37. |
| `@react-native-async-storage/async-storage` | Not added; theme persistence/storage policy remains follow-up for PLRNUI-38. |
| `expo-clipboard` | Not added; clipboard policy remains follow-up for PLRNUI-39. |
| `react-native-svg` / `lucide-react-native` | Not added; no current source import in `src/index.ts`. |
| `react-dom` / `react-native-web` / `lucide-react` | Not added; no current source import and no package web runtime decision in this task. |
| `ui` | Not added; audit evidence classified it as opaque/no-import evidence. |

## Commands executed

| Command | Result |
| --- | --- |
| `pwd` | `/home/optimus/Documenti/GitHub/personal-library-react-native-components` |
| `git branch --show-current` | `main` |
| `git status --short` | Initial: no output. |
| `node -v` | `v20.19.2` |
| `npm -v` | `9.2.0` |
| `npm install --package-lock-only` | Initial sandbox run failed with `EAI_AGAIN` resolving `registry.npmjs.org`; escalated network run passed. npm emitted `EBADENGINE` warnings because React Native/Metro packages require Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`, while local Node is `v20.19.2`. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed. |
| `npm pack --json` | Initial run failed with `EROFS` writing npm cache under `/home/optimus/.npm`; rerun with `npm_config_cache=/tmp/plrnui36-npm-cache` passed. |
| `npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 node -v` | Passed: `v22.23.0`. |
| `npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 node /usr/bin/npm install --package-lock-only` | Passed under Node 22. |
| `npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 node /usr/bin/npm run typecheck` | Passed under Node 22. |
| `npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 node /usr/bin/npm run build` | Passed under Node 22. |
| `npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 node /usr/bin/npm pack --json` | Passed under Node 22. |

## Package artifact

`npm_config_cache=/tmp/plrnui36-npm-cache npm pack --json` produced:

| Field | Value |
| --- | --- |
| Package | `@personal-library/react-native-components@0.0.0` |
| Filename | `personal-library-react-native-components-0.0.0.tgz` |
| Package size | `2121` bytes |
| Unpacked size | `4140` bytes |
| Entry count | `7` |
| Bundled dependencies | None |

Packaged files:

- `LICENSE`
- `README.md`
- `dist/index.d.ts`
- `dist/index.d.ts.map`
- `dist/index.js`
- `dist/index.js.map`
- `package.json`

## Consumer smoke test

Temporary consumer path: `/tmp/plrnui36-consumer`.

| Step | Result |
| --- | --- |
| Create clean Expo app | Passed after escalated network access: `npx create-expo-app@latest /tmp/plrnui36-consumer --template blank-typescript --yes`. Generated app used `expo@~56.0.12`, `react@19.2.3`, `react-native@0.85.3`, `typescript@~6.0.3`. npm emitted `EBADENGINE` warnings for Node `v20.19.2`. |
| Install local tarball | Passed: `npm_config_cache=/tmp/plrnui36-npm-cache npm install /home/optimus/Documenti/GitHub/personal-library-react-native-components/personal-library-react-native-components-0.0.0.tgz`. |
| Dependency tree check | Passed: `npm ls @personal-library/react-native-components react react-native --depth=0` showed one installed package plus consumer-owned `react@19.2.3` and `react-native@0.85.3`. |
| Node root import | Passed: `node -e "import('@personal-library/react-native-components').then((m)=>{ console.log(m.PACKAGE_NAME); })"` printed `@personal-library/react-native-components`. |
| TypeScript root import | Passed after importing `PACKAGE_NAME` in `/tmp/plrnui36-consumer/App.tsx`: `npx tsc --noEmit` exited 0. |
| Expo web export | Not applicable for this smoke: failed before package validation because the blank native template does not install `react-dom` and `react-native-web`. PLRNUI-36 did not add web runtime dependencies. |
| Expo Android export / Metro | Failed after Metro started: `Android Bundling failed 475ms index.ts (1 module)` with `SyntaxError: index.ts: Invalid regular expression: missing /`. |

## Node 22 consumer smoke test

Temporary consumer path: `/tmp/plrnui36-node22-consumer`.

| Step | Result |
| --- | --- |
| Create clean Expo app under Node 22 | Passed: `HOME=/tmp/plrnui36-node22-expo-home npm_config_cache=/tmp/plrnui36-node22-npm-cache npx -p node@22 -p create-expo-app@latest create-expo-app /tmp/plrnui36-node22-consumer --template blank-typescript --yes`. |
| Generated Expo baseline | `expo@~56.0.12`, `react@19.2.3`, `react-native@0.85.3`, `typescript@~6.0.3`. |
| React Native peer decision | Kept `react-native` peer range as `>=0.85.0 <0.86.0`, matching the generated consumer's `react-native@0.85.3` without widening beyond the `0.85.x` line. |
| Install local tarball | Passed under Node 22. |
| Dependency tree check | Passed: `@personal-library/react-native-components@0.0.0`, `react@19.2.3`, `react-native@0.85.3`. |
| Node root import | Passed: printed `@personal-library/react-native-components`. |
| TypeScript root import | Passed after importing `PACKAGE_NAME` in `/tmp/plrnui36-node22-consumer/App.tsx`: `tsc --noEmit` exited 0. |
| Expo Android export / Metro | Passed under Node 22: `Android Bundled 12265ms index.ts (566 modules)` and exported `dist`. |

## Final git status

Final repository status after this report:

```text
?? .node-version
?? .nvmrc
 M package-lock.json
 M package.json
?? audit/release/package-dependency-realignment.md
```

## Verdict

Verdict: **READY**

Dependency metadata realignment and the Node 22 runtime baseline are validated for lockfile generation, typecheck, build, pack, clean Expo install, root import, TypeScript resolution and Expo Android/Metro export. The previous Metro blocker reproduced under Node `v20.19.2` is no longer present when the smoke test runs with Node `v22.23.0`.

## Residual risks and follow-up

- The host shell still defaults to Node `v20.19.2`; developers and CI should use `.nvmrc`, `.node-version` or equivalent tooling to run Node 22.
- Keep native dependency decisions out of PLRNUI-36:
  - `react-native-safe-area-context` -> PLRNUI-37.
  - AsyncStorage/theme persistence -> PLRNUI-38.
  - `expo-clipboard` -> PLRNUI-39.
