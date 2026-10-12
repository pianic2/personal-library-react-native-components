# AI layer: architecture and layout

This directory and its siblings hold the metadata that coding agents read about the library. Decisions: D8 (a single metadata source, the colocated `<Name>.meta.ts`) and D13 (only `./meta` JSON ships in npm; skills, `AGENTS.md` and `llms*.txt` live in the repository and the docs site).

## File classes

Every file class is labelled `GENERATED` (never edit by hand, rebuilt by a script) or `HAND-WRITTEN` (edited by people, reviewed in PRs).

| Path | Class | Role | Ships in npm |
| --- | --- | --- | --- |
| `src/components/<Name>/<Name>.meta.ts` | HAND-WRITTEN | Single metadata source (D8): maturity, status, usage, a11y and API notes per component. Read by the maturity gate, the catalog, the docs lint and the AI manifests. | no (excluded from the build) |
| `ai/schema/*.schema.json` | HAND-WRITTEN | JSON Schemas that the manifests must satisfy. | no |
| `ai/manifests/*.json` | GENERATED | Machine-readable manifests (today `props.json`, rebuilt by `npm run ai:build:props`). Never edit by hand. | copied to `dist/meta/` by `npm run ai:build` |
| `dist/meta/*.json` | GENERATED | The published copy of the manifests, shipped under `dist/meta/` (the `package.json` `exports` map has no `./meta` subpath yet, so consumers read it by file path from `node_modules`). Created by `npm run ai:build`, removed by `npm run clean`. | yes (inside `dist`) |
| `ai/cards/*` | GENERATED | Per-component agent cards, produced from the `.meta.ts` files by the AI scripts (not created yet). | no |
| `scripts/ai/*.mjs` | HAND-WRITTEN | The generators and checks behind `ai:build:props` and, later, the cards. | no |
| `skills/**` | HAND-WRITTEN | Agent skills for this repository (for example `texo-execute`). | no (D13) |
| `AGENTS.md`, `llms.txt`, `llms-full.txt` | HAND-WRITTEN | Entry points for agents, kept in the repository and on the docs site. | no (D13) |
| `ai/README.md` | HAND-WRITTEN | This file. | no |

Generated files are never edited by hand: change the `.meta.ts` source or the generator and rebuild. A check script must fail when a generated file is stale (`ai:build:props -- --check` does this for `props.json`).

## Package wiring

`package.json` `files` is `["dist", "README.md", "LICENSE"]` and `scripts/release-guard.mjs` rejects any other entry. `dist` already contains `dist/meta`, so the JSON manifests ship without a separate entry, while `skills/`, `AGENTS.md` and `llms*.txt` are outside `dist` and therefore never published. `npm run ai:check` fails if `files` ever lists `skills`, `AGENTS` or `llms*`, or if `ai/manifests` holds no JSON.

Verify with:

```sh
npm run ai:build          # ai/manifests/*.json -> dist/meta/
npm run package:dry-run   # lists dist/meta/*.json; no skills/, AGENTS.md or llms*.txt
```

`npm run build:prod` (run by `prepack`) cleans `dist`, type-checks, builds, and then runs `ai:build`, so `dist/meta` is part of every pack. `release:check` goes through the same chain.

## Token budget tiers

Agent-facing text is sized by how often it is read:

| Tier | Content | Budget (tokens) | Where |
| --- | --- | --- | --- |
| 0 | Always loaded: `AGENTS.md`, the repository rules | 1,500 | repository |
| 1 | Loaded per task: a skill's `SKILL.md` | 2,000 | `skills/<name>/` |
| 2 | Loaded on demand: one component card or reference file | 800 each | `ai/cards/`, `skills/<name>/references/` |
| 3 | Never loaded whole: full manifests (`props.json`) | query by component | `ai/manifests/`, `dist/meta/` |

Tokens are estimated as characters / 4 (the same estimate `scripts/ticket-prompt.mjs` prints). The budgets are targets for authors; the enforcing check is added with the card generator.
