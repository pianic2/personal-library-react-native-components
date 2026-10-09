# Migrating from the legacy package to Texo

> **Draft.** This guide contains placeholders written as `<TEXO_PACKAGE>`, `<LEGACY_PACKAGE>` and similar tokens. They are replaced at the cutover, when the final names are applied (see [Package identity](../config/package-identity.json) and ADR 0013). `node scripts/check-doc-tokens.mjs` lists the tokens that remain and fails the release while any exist.

## Why

`<LEGACY_PACKAGE>` is replaced by `<TEXO_PACKAGE>`. The legacy name keeps working during the migration: it becomes a thin shim that only re-exports `<TEXO_PACKAGE>` (see [ADR 0013](../audit/adr/0013-legacy-shim-policy.md)). You can upgrade first, change imports later, and remove the shim last, without a flag day.

## The 3-step path

### Step 1: install the shim as it is

Update the legacy package to the shim version. No code change is needed; the shim and `<TEXO_PACKAGE>` are released with the same version number, and the shim depends on `<TEXO_PACKAGE>` with a caret range of its major version.

```sh
npm install <LEGACY_PACKAGE>@^1
```

Your imports keep working:

```tsx
import { Button } from "<LEGACY_PACKAGE>";

export function SaveButton() {
  return <Button label="Save" />;
}
```

### Step 2: run the codemod

The codemod rewrites import, export, `require`, dynamic `import()` and `jest.mock` specifiers from the legacy name to the new name, subpaths included, and keeps comments and type-only imports. It is a dry run unless you pass `--write`. Run it from a checkout of the Texo repository, pointing at your sources (the packaged `npx` command is decided with the codemod packaging tickets):

```sh
node tools/codemod/codemod.mjs src            # preview
node tools/codemod/codemod.mjs --write src    # rewrite
```

After the rewrite the same code reads:

```tsx
import { Button } from "<TEXO_PACKAGE>";

export function SaveButton() {
  return <Button label="Save" />;
}
```

Running the codemod twice changes nothing the second time. Review the diff, run your typecheck and tests, then commit.

### Step 3: remove the shim

Once no import refers to the legacy name (search for it), remove the shim and install the target directly:

```sh
npm uninstall <LEGACY_PACKAGE>
npm install <TEXO_PACKAGE>
```

## Subpath table

Every subpath exists identically in the shim (ADR 0009 and ADR 0013). The mapping is one to one: replace the package name and keep the rest.

| Legacy specifier | New specifier |
| --- | --- |
| `<LEGACY_PACKAGE>` | `<TEXO_PACKAGE>` |
| `<LEGACY_PACKAGE>/theme` | `<TEXO_PACKAGE>/theme` |
| `<LEGACY_PACKAGE>/tokens` | `<TEXO_PACKAGE>/tokens` |
| `<LEGACY_PACKAGE>/native` | `<TEXO_PACKAGE>/native` |
| `<LEGACY_PACKAGE>/native/expo` | `<TEXO_PACKAGE>/native/expo` |
| `<LEGACY_PACKAGE>/adapters/<name>` | `<TEXO_PACKAGE>/adapters/<name>` |
| `<LEGACY_PACKAGE>/testing` | `<TEXO_PACKAGE>/testing` |
| `<LEGACY_PACKAGE>/meta` | `<TEXO_PACKAGE>/meta` |
| `<LEGACY_PACKAGE>/package.json` | `<TEXO_PACKAGE>/package.json` |

Deep imports into `src/` or `dist/` were never public and are not mapped.

## FAQ

**Which peer dependencies do I need?** The same as today: `react` and `react-native` within the ranges in [Compatibility](compatibility.md) (Expo 57 / React Native 0.86 for 1.0). Optional adapters add their own optional peers only when you use them, see ADR 0010.

**I see two copies of React, or hooks fail with "Invalid hook call".** Check `npm ls react`; only one copy may exist. The shim depends on `<TEXO_PACKAGE>` with a caret range so the package manager can share one copy; if both names are installed at different majors, upgrade them together.

**Metro still serves the old code.** Clear the cache after changing imports or reinstalling: `npx expo start --clear` (or `npx react-native start --reset-cache`).

**Can I roll back?** Yes. Reinstall the previous version of `<LEGACY_PACKAGE>` and revert the codemod commit; nothing else changes. Nothing is unpublished: old versions are only deprecated.

**Does the shim warn at runtime?** No. Deprecation is shown in the package metadata and in these docs, not in your console.

## Timeline

- The shim is released in lockstep with `<TEXO_PACKAGE>` and stays installable for 12 months after the cutover date set by the release plan (decision H4, ADR 0013).
- Deprecated aliases of renamed props stay available through 1.x (ADR 0011).
- After the sunset window the shim latest version is marked deprecated; the versions keep resolving.
