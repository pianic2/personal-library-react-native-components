# ADR 0016: Component metadata has a single colocated source

## Status

Accepted. Applies decision D8 of `audit/texo-v1/DECISIONS.md` (one colocated, typed metadata source; no parallel registries).

## Context

Five overlapping metadata registries were planned: a maturity manifest, `*.catalog.ts` files, `catalog/registry.ts`, `ai/meta/*.json` and token manifests. Each would drift from the others. The maturity gate, the catalog app, the docs lint and the AI manifests all need the same facts about a component: its name, family, maturity, a short summary, when to use it and when not, how it composes, accessibility notes, variants, states, platform notes and examples.

## Decision

1. **One file per component.** Each component directory holds `<Name>.meta.ts` exporting `meta: ComponentMeta`. The type lives in `src/meta/types.ts`. A component and its metadata are created, changed and removed together.
2. **JSON-serialisable only.** `ComponentMeta` contains strings, arrays and plain objects. The file may use `import type` and nothing else, so it can be read without running component code.
3. **One loader and lint.** `scripts/lib/meta.mjs` reads every `src/components/*/<Name>.meta.ts` (it transpiles the file with the repo's `typescript`, no extra dependency) and offers three modes: `--lint` (structure), `--strict` (the stricter content bar, extended by the maturity gate) and `--json` (sorted output for the catalog and the AI manifests). The structural lint fails closed: a missing meta file, an unknown key, a name that differs from the directory, a summary over 140 characters, a `whenNotToUse.instead` or composition entry that names a non-existent component, a missing state or example, or a value that is not JSON all give exit 1; unreadable input or a file that cannot be evaluated gives exit 2. Meta files are trusted in-repo code reviewed like any source file: the loader evaluates them in an empty `node:vm` context (no `process`, no host objects, no `require`, a one-second timeout) as defence in depth, not as a security boundary.
4. **Not part of the package.** Component code never imports meta, `src/index.ts` does not export it and `tsconfig.build.json` excludes `**/*.meta.ts` and `src/meta`, so `dist` contains no metadata. Consumers of the metadata (catalog, AI manifests) read the source files through the loader.
5. **No parallel registries.** `ai/meta/*.json`, `<Name>.catalog.ts` and `catalog/registry.ts` are not created. Generated artifacts (AI cards, catalog data) are derived from `--json` output and are never edited by hand.
6. **Status values** follow the maturity ladder of ADR 0003 and the audit: `prototype`, `demo`, `stable`, `production-ready`, plus `deprecated`. The mapping to the consumer-facing stability labels is in ADR 0011.

## Consequences

- Adding a component requires its meta file; `--lint` fails otherwise (the count of meta files equals the count of component directories).
- The seed files record the maturity audit of 2026-10-09 (18 `demo`, 18 `prototype`) and its known accessibility and platform gaps; they must be updated by the ticket that fixes a gap. `Button` carries the fullest reference entry.
- The lint is not yet wired into `release:check` or CI (`package.json` and the workflows belong to other tickets); the test in `tests/meta` runs it on the repository.
- Alternatives rejected: a central JSON manifest (drifts from the component), JSDoc tags on the component (not JSON-readable without a compiler and mixes metadata into runtime files), one registry per consumer (the original five).
