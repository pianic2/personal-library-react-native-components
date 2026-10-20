# AGENTS.md

Instructions for coding agents (Codex, Cursor, Copilot, Claude Code) working in this repository. Keep it short; follow the links for detail.

## What this repo is

`@personal-library/react-native-components`: a React Native / Expo component library, published from this single codebase. Source is TypeScript under `src/`. The Texo rename is a later cutover (E15, ADR 0017); until then use the current package name and import paths.

## Commands

Run from the repository root. Every command below exists in `package.json` `scripts`.

| Task | Command |
| --- | --- |
| Type-check sources | `npm run typecheck` |
| Type-check public contracts | `npm run typecheck:contracts` |
| Type-check tests | `npm run typecheck:tests` |
| Unit tests | `npm test` |
| One test file | `node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/react-native-loader.mjs --test tests/path/file.test.ts` |
| Build | `npm run build` |
| Regenerate AI props manifest | `npm run ai:build:props` |
| Build AI metadata into `dist/meta` | `npm run ai:build` |
| Check AI layer drift | `npm run ai:check` |
| Regenerate public API snapshot | `npm run api:snapshot` |
| Check public API snapshot | `npm run api:snapshot:check` |
| Maturity gate | `npm run maturity:check` |
| Regenerate / check maturity docs | `npm run maturity:docs` / `npm run maturity:docs:check` |
| Token usage gate | `npm run tokens:check` |
| Docs compatibility check | `npm run docs:compat:check` |
| Bundle size | `npm run size` |
| Release check | `npm run release:check` |

Also run `node scripts/check-api-conventions.mjs` before pushing API changes.

## Repo map

- `src/components/<Name>/`: component, its `<Name>.meta.ts` (single metadata source, ADR 0016), exports.
- `src/index.ts`, `src/theme`, `src/tokens`: public entry points (root, `./theme`, `./tokens`).
- `tests/`: `node --test` suites; `tests/scripts/` covers repo scripts.
- `docs/`: user docs and policies (`docs/policies/`); `docs/components/<category>/` per-component pages.
- `ai/`: AI layer (schema, generated manifests, examples, consumer snippet). See `ai/README.md`.
- `skills/`: agent skills for this repository (not published).
- `scripts/`: gates and generators.
- `audit/adr/`: architecture decisions; `audit/texo-v1/`: backlog, decisions, state.

## Rules

1. Do not rename the package, its imports or public exports; the Texo cutover is a separate epic (E15).
2. One codebase: no forks, copies or parallel implementations of a component.
3. Generated files are never hand-edited. Change the source (`.meta.ts`, generator) and rebuild: `ai/manifests/*.json`, `audit/api/snapshots/*`, maturity docs, `dist/`.
4. Public API changes need `npm run api:snapshot` committed and a changeset when user-visible.
5. Follow API conventions (ADR 0014): use `open` / `defaultOpen` / `onOpenChange`, never `visible` / `isOpen`, on exported prop types.
6. Respect ticket file ownership: `node scripts/check-ownership.mjs PLRNUI-<n> origin/texo/v1`. Do not edit `audit/texo-v1/ownership-extensions.json`, `.github/`, or `scripts/check-*` from a feature branch.
7. Do not change `config/size-limits.json` to make a bundle budget pass.
8. Optional peer dependencies only via `peerDependenciesMeta.optional` behind an explicit subpath or adapter (ADR 0010, 0012).
9. Reuse existing components and tokens before adding new UI or hard-coded values.
10. Commit messages: `add|fix|chore(PLRNUI-<n>): message` (checked by `scripts/check-commit-msg.mjs`).

## Where to look first

- Tier-0 rules: this file. Tier-1 and tier-2 layout and budgets: `ai/README.md`.
- Component facts: `src/components/<Name>/<Name>.meta.ts`, then `ai/manifests/props.json` (query by component, do not read whole).
- Process: `docs/policies/execution-runbook.md`, `audit/adr/0020-ticket-execution-protocol.md`.
- Decisions: `audit/texo-v1/DECISIONS.md`.

## Using the library from an app

Copy `ai/AGENTS.consumer.md` into the consuming app's own `AGENTS.md`.
