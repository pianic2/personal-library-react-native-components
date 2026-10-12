# App starter templates

This folder holds the app starter templates (tabs, auth, dashboard, settings, onboarding, e-commerce, social feed). No starter exists yet; this document and `templates/_contract/` define the contract every starter must follow. The contract is enforced by `node scripts/check-templates.mjs`.

## Folder contract

```
templates/<name>/
  package.json     # starter's own manifest
  template.json    # generator metadata
  README.md        # how to run and what the starter shows
  app/             # source of the starter (at least one .ts/.tsx/.js/.jsx file)
```

Rules checked by `scripts/check-templates.mjs`:

1. `<name>` is kebab-case. Folders starting with `_` or `.` are not templates (`_contract` holds the reference example).
2. `README.md` exists and is not empty.
3. `app/` exists and contains at least one source file.
4. `template.json` is valid JSON with `name` (equal to the folder name), `description` and `version` (`x.y.z`).
5. `package.json` is valid JSON, has a `name`, and depends on `@personal-library/react-native-components` (dependencies or peerDependencies). In every dependency section and in `overrides`/`resolutions`/`pnpm`, the library may only be given a plain semver range (`^1.2.3`, `>=1.0.0 <2.0.0`, `1.2.3`); `file:`, `github:`, `npm:`, `*`, relative paths and aliases of the library under another name are rejected. Any `overrides`/`resolutions` key containing the library name (`name@range`, `a>name`, `**/name`) is treated as the library. A template must not declare `workspaces` or `bundledDependencies`.
6. Source files consume the library only through public entry points: the package root or a subpath listed in the library `exports` (currently `/theme` and `/tokens`). Specifiers are collected from `import`/`export ... from`, `import()`, `require()`, `require.resolve()`, `jest.mock`-style calls and `.mdx` files, on both the raw text and the comment-stripped text (the stripper is not regex-literal or JSX aware, so the raw pass keeps it fail-closed; as a consequence an import that only appears inside a comment is also reported). `createRequire` and `import.meta.resolve` are errors wherever they appear. Source extensions are matched case-insensitively (`.ts .tsx .js .jsx .mjs .cjs .mts .cts .mdx .vue .html .es6`). A non-literal specifier in `import()`/`require()` is an error because it cannot be verified. Absolute-path imports are errors. Deep imports such as `@personal-library/react-native-components/src/...` or `.../dist/...`, and relative imports that leave the template folder, are errors.
7. Symlinks anywhere inside a template, and `node_modules`, `dist`, `build` or `.expo` directories, are errors (nothing is skipped silently).
8. Only `README.md` and `_*/` folders may sit beside template folders.

## Running the checker

```
node scripts/check-templates.mjs                       # checks templates/
node scripts/check-templates.mjs --root <dir>          # checks another folder (used by tests)
```

```
node scripts/check-templates.mjs --build <name> [--work-dir <dir>]   # contract check, then build the template
```

`--build <name>` (PLRNUI-234) first runs the contract check; if it passes it builds that template against the **packed local library**: `npm run build` and `npm pack` of this repository, a copy of the template in `<work-dir>/app` (default `<tmpdir>/check-templates-build-<name>`) whose library dependency points at the tarball, `npm install`, the template's `typecheck` script when it has one, and `expo export --platform web`. It then checks the export: an `index.html` with a root element and a script, and a non-empty JavaScript bundle. The template folder itself is never changed. It needs network access (npm install) and takes a few minutes; it is the command a CI template job runs. Any failing step exits `1`; an unknown template or bad arguments exit `2`.

Exit codes: `0` ok (an empty templates folder passes), `1` contract violations (listed on stderr), `2` usage error or unreadable input. The checker is dependency-free and deterministic.

## Generator CLI contract

A future generator reads `template.json` and copies the folder (excluding `node_modules`) to a destination, replacing the `name` in the copied `package.json`. It must refuse to run on a template that fails `check-templates`. See `_contract/template.json` for the metadata shape.

## Tests

`tests/templates/contract.test.ts` covers an empty fixture (passes), a valid template (passes), a missing README (fails), a deep import (fails) and the `--build` orchestration (with a fake `npm` first on the PATH: the order of the commands, the rewritten dependency, every failing step, a broken export). It is not part of `npm test`; run it with `node --import tsx --test tests/templates/contract.test.ts`.
