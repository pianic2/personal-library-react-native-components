# Contributing

Thank you for helping. This guide is for anyone sending a change: you do not
need access to any internal tracker to contribute.

## Setup

- Node.js `>=22.13.0` (see `engines` in `package.json`).
- Install dependencies from the lockfile:

```sh
npm ci
```

## Commands

Run these before opening a pull request:

```sh
npm run typecheck
npm run typecheck:contracts
npm test
npm run build
npm run package:dry-run
npm run release:check
```

`npm run release:check` runs the full release gate (it reinstalls, builds and
runs the consumer smoke tests), so run it last. The other scripts are listed in
`package.json`.

## Adding or changing a component

Components move along a maturity ladder: prototype, demo, stable,
production-ready. A component must meet at least the `demo` minimum before it is
treated as ready to use:

- real rendering;
- typed API;
- main states and variants;
- theme support (no hard-coded colors; use theme tokens);
- an example;
- presence in the component catalog;
- minimal verification (tests).

Checklist for a new or changed component:

1. Implement it under `src/components/<Name>/` and export it, and its props type,
   from `src/index.ts`.
2. Use theme tokens for color, spacing, radius and typography.
3. Add or update tests under `tests/` (render and accessibility checks, plus
   type tests in `tests/types/` for the public props).
4. Add a documentation page under `docs/components/` and an example under
   `examples/`.
5. Make sure the stability level you claim matches the component stability
   classification in `audit/adr/0003-component-stability-classification.md`.
6. Run the commands above.

## Release notes (changesets)

User-visible changes need a release note. The repository is adopting
[Changesets](https://github.com/changesets/changesets) for this; until it is
enabled, describe the user-visible effect and its semver impact (patch, minor or
major) in the pull request description.

## Pull request flow

1. Fork the repository and create a branch from the default branch.
2. Make a focused change; keep unrelated refactors out of the pull request.
3. Write commit messages as `add: ...`, `fix: ...` or `chore: ...`, optionally
   with a scope such as `fix(button): ...`. An internal ticket key is not
   required for external pull requests.
4. Open the pull request and describe what changed and how you verified it.
   Wait for the automated checks to pass.

Report security problems privately, as described in [SECURITY.md](SECURITY.md).
Ask questions as described in [SUPPORT.md](SUPPORT.md). Everyone taking part is
expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Using AI assistants

You may use AI coding assistants. You remain responsible for the change:

- read and understand every line you submit;
- run the commands above yourself and report their real results;
- do not paste generated text that you have not checked against the code;
- do not add dependencies, change public API or touch release configuration
  because an assistant suggested it, without explaining why in the pull request.

## Maintainers

<details>
<summary>Internal ticket process (maintainers only)</summary>

Maintainers work from PLRNUI tickets. These rules do not apply to external pull
requests.

- Keep changes narrow and traceable to the ticket that authorizes them.
- Branches are named `texo/PLRNUI-<n>-<slug>` and open pull requests to
  `texo/v1`; commit messages are `add|fix|chore(PLRNUI-<n>): ...`.
- Execution rules, branching and review are documented in
  [`docs/policies/`](docs/policies/) (for example `branching.md` and
  `execution-runbook.md`).
- Do not migrate runtime source without audit evidence, do not stabilize public
  API without a ticket, and do not add a legacy package alias without an
  explicit owner decision.
- `audit/` may preserve historical references for traceability. Audit files
  must not become runtime source or published package API. Mentioning a
  component, token, import path or legacy package name in `audit/` does not
  promote it to source code or public API.
- Do not commit generated artifacts unless the ticket explicitly justifies them.

</details>
