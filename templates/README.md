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
5. `package.json` is valid JSON, has a `name`, and depends on `@personal-library/react-native-components` (dependencies or peerDependencies). In every dependency section and in `overrides`/`resolutions`/`pnpm`, the library may only be given a plain semver range (`^1.2.3`, `>=1.0.0 <2.0.0`, `1.2.3`); `file:`, `github:`, `npm:`, `*`, relative paths and aliases of the library under another name are rejected.
6. Source files consume the library only through public entry points: the package root or a subpath listed in the library `exports` (currently `/theme` and `/tokens`). Specifiers are collected from `import`/`export ... from`, `import()`, `require()`, `require.resolve()`, `jest.mock`-style calls and `.mdx` files, after comments are stripped. A non-literal specifier in `import()`/`require()` is an error because it cannot be verified. Absolute-path imports are errors. Deep imports such as `@personal-library/react-native-components/src/...` or `.../dist/...`, and relative imports that leave the template folder, are errors.
7. Symlinks anywhere inside a template, and `node_modules`, `dist`, `build` or `.expo` directories, are errors (nothing is skipped silently).
8. Only `README.md` and `_*/` folders may sit beside template folders.

## Running the checker

```
node scripts/check-templates.mjs                       # checks templates/
node scripts/check-templates.mjs --root <dir>          # checks another folder (used by tests)
```

Exit codes: `0` ok (an empty templates folder passes), `1` contract violations (listed on stderr), `2` usage error or unreadable input. The checker is dependency-free and deterministic.

## Generator CLI contract

A future generator reads `template.json` and copies the folder (excluding `node_modules`) to a destination, replacing the `name` in the copied `package.json`. It must refuse to run on a template that fails `check-templates`. See `_contract/template.json` for the metadata shape.

## Tests

`tests/templates/contract.test.ts` covers an empty fixture (passes), a valid template (passes), a missing README (fails), and a deep import (fails). It is not part of `npm test`; run it with `node --import tsx --test tests/templates/contract.test.ts`.
