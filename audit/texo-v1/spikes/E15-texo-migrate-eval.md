# E15 evaluation: where does the migration tool live? (PLRNUI-268, E15-11)

Status: recommendation for the product owner (PO). Inputs: the codemod engine `tools/codemod/` (PLRNUI-265, E15-09), ADR 0013 (legacy shim policy), ADR 0010 (peer and dependency policy), DECISIONS.md D10 and H1, the E13 CLI ticket E13-32 (PLRNUI-394).

## Question

Consumers of the legacy package need an automated way to rewrite their imports to Texo. E13 plans an optional Texo CLI (`info` and `doctor`, no `add`). Should migration be a `texo migrate` subcommand there, or live elsewhere?

## Options

| Id | Option | Where the code ships |
| --- | --- | --- |
| A | Standalone package run with `npx` | Its own package, e.g. `@theopificium/texo-migrate` (the `-migrate` name is a proposal; the scope follows H1), bin `texo-migrate` |
| B | `texo migrate` subcommand | The Texo CLI (E13-32, `bin` -> `dist/cli.js`) |
| C | A bin in the legacy shim | The shim package |
| D | A separate migration bin in Texo | The Texo package, `bin` entry `texo-migrate` |

## Comparison

| Criterion | A: standalone | B: `texo migrate` | C: bin in the shim | D: bin in Texo |
| --- | --- | --- | --- | --- |
| Bootstrap: usable before Texo is installed | Yes: `npx` fetches it; works at step 2 of the migration path with only the shim or nothing installed | Weak, not absent: after step 1 Texo is installed only transitively through the shim, and (as far as we know, to be confirmed in the rehearsal) npm links the `bin` of direct dependencies only, so `texo` would not be on `node_modules/.bin`; a consumer would have to run `npx @theopificium/texo ...`, which fetches the whole Texo package just to run it (bare `texo` on npm is a different, taken package, H1, and must never be used here) | Partly: the shim exists at step 1, but a bin in the shim breaks the rule that the shim has no behaviour of its own and exactly one dependency (ADR 0013, ADR 0010) | Same as B: the bin of a transitive dependency is not linked, and a direct install of Texo is the step being adopted |
| Versioning | Independent: a mapping or parser fix ships without a Texo release | Locked to Texo releases (D10 lockstep with the shim) | Locked to the shim, which is generated and released in lockstep | Locked to Texo |
| Offline use | After the first `npx` fetch, or `npm install -D` once; works with a cached or vendored copy | Yes once Texo is installed | Yes once the shim is installed | Yes once Texo is installed |
| Agent usability | One command with `--json`, no project state needed | Same command surface, but agents must install Texo first | Same as A once installed; confusing because the tool lives in a package that is being removed | Same as B |
| Size of the Texo install | No effect | Adds migration code (and a dependency on the TypeScript API) to the CLI used by everyone | No effect on Texo; adds weight to the shim | Adds the migration code to every Texo install |
| Dependencies | `typescript` only | The CLI is zero-dependency by design (E13-32); the TypeScript API would be a new dependency | Violates "exactly one dependency" | New dependency in Texo, against ADR 0010 |
| Lifetime | Can be deprecated after the shim sunset without touching Texo | Stays in Texo forever or needs a breaking removal | Disappears with the shim, early | Stays in Texo forever |
| Discoverability | Lower: needs the migration guide to point at it | Higher: `texo --help` | Low | Medium |
| Supply-chain surface | One more package to publish and secure | None | None | None |

The bootstrap row alone does not decide the choice: with the shim installed Texo is present, so B and D are usable if the consumer calls the transitive package by `npx`. The deciding criteria are versioning (a fix to the mapping or the parser must not need a Texo release), lifetime (the tool should disappear after the sunset without a breaking change to Texo) and dependencies (the TypeScript API would become a dependency of Texo or of its zero-dependency CLI).

## Recommendation

**Option A: a standalone package run with `npx`**, built from `tools/codemod/` (PLRNUI-265). It removes the bootstrap problem, keeps the Texo and shim packages free of migration code and extra dependencies, and can be retired after the sunset without a breaking change. The cost is one more package to publish; that is acceptable because it is published once and is small. The migration guide (PLRNUI-270) points at it; discoverability is solved there and in the shim README.

`texo migrate` is **not** added to the E13 CLI (it would also have to be invoked as `npx @theopificium/texo ...`, never as bare `texo`, which is another package on npm). If the PO later wants discoverability from the CLI, `texo migrate` may be a documented alias that only prints or spawns the `npx` command; it must not embed the codemod.

## Command surface (for the packaging ticket)

```
texo-migrate [options] <path...>
```

| Flag | Meaning |
| --- | --- |
| (default) | Dry run: report what would change, write nothing. `--dry-run` is accepted as an explicit synonym. |
| `--write` | Rewrite files in place. |
| `--check` | Write nothing; exit 1 if any file would change (for CI after the migration). Mutually exclusive with `--write`. |
| `--mapping <file>` | Mapping file (`from`, `to`); defaults to the packaged mapping with the final names. |
| `--json` | Print one JSON document instead of text. |
| `--only imports\|deps\|config` | Run one part of the migration; the default runs `imports` only until the other parts exist. |

Parts: `imports` rewrites import, export, `require`, dynamic `import()`, `jest.mock` and `declare module` specifiers (exists today in `tools/codemod/`); `deps` swaps the dependency entry in `package.json` (dry run by default; not implemented); `config` rewrites known configuration references such as Jest `moduleNameMapper` and `tsconfig` `paths` (not implemented, to be scoped by the packaging ticket).

Exit codes (as in `tools/codemod/codemod.mjs`): `0` success (or nothing to change with `--check`); `1` `--check` found changes, or a file could not be parsed or written (that file is left untouched); `2` usage or mapping error.

Behaviour details: with `--write`, a file that fails to parse is reported and left untouched while the other files are still rewritten, then the exit code is 1. Usage and mapping errors exit 2; with `--json` they print `{ "schemaVersion": 1, "error": "<message>", "exitCode": 2 }` and nothing else. `deps`, when implemented, follows the same modes (dry run by default, `--write` to apply, `--check`). `config` is specified by the packaging ticket; the minimum is Jest `moduleNameMapper`, `tsconfig` `paths` and Metro `extraNodeModules` entries that name the legacy package.

JSON output:

```json
{
  "schemaVersion": 1,
  "mode": "dry-run",
  "scanned": 120,
  "changed": [{ "file": "src/App.tsx", "count": 2 }],
  "errors": [],
  "exitCode": 0
}
```

`mode` is `dry-run`, `write` or `check`; each entry of `errors` is `{ "file": "<path>", "message": "<text>" }`. Keys are sorted and paths are relative to the working directory, so the output is deterministic.

Gaps between `tools/codemod/` today and this surface: no `--json`, no `--dry-run` synonym, no `--only`, no `deps` or `config` parts, no packaging or `bin` entry, and the mapping target is still the placeholder `@texo-placeholder/ui`.

## Coordination note with E13

Request to the E13 CLI owner (E13-32, PLRNUI-394, optional, depends on E13-10 and E13-19; no named owner exists in the backlog, so the PO routes this): keep the `info` and `doctor` scope unchanged, no `migrate`, no `add`. E13-32 notes that bin names must stay stable if the shim exposes Texo bins; under option A the shim exposes none. The MCP server (E13-33, PLRNUI-395) is read-only and unaffected. The packaging of the standalone tool belongs to E15-10 (PLRNUI-267, wiring the mapping and packaging to the final Texo names); the migration guide (E15-12, PLRNUI-270) references the command. E15-10 (PLRNUI-267) depends on this evaluation. If the PO prefers option B, E13-32 gains a `migrate` subcommand and a TypeScript dependency, which needs an amendment of its "zero runtime dependencies" scope.

## Decision requested from the PO

1. Accept option A (standalone `npx` package), or choose another option.
2. Confirm the package name (`@theopificium/texo-migrate` is a proposal; the `@theopificium` scope itself is fixed by H1, ownership to be confirmed).
3. Decide whether `texo migrate` exists as a thin alias in the E13 CLI.
