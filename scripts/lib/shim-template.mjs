// Templates for the generated legacy shim (PLRNUI-136, ADR 0013). Everything here is plain text generation:
// the shim contains export-from statements only, never behaviour.

export function renderReExport(specifier) {
  return `export * from ${JSON.stringify(specifier)};\n`;
}

export function renderReadme({ legacy, target, version }) {
  return `# ${legacy}

> **Deprecated.** This package is a thin re-export of [\`${target}\`](https://www.npmjs.com/package/${target}). It contains no code of its own: every export comes from \`${target}\` at the same version (\`${version}\`).

## Migrate

1. Keep this package for now: your imports keep working.
2. Rewrite the imports with the migration codemod.
3. Remove this package and install \`${target}\` directly.

\`\`\`sh
npm uninstall ${legacy}
npm install ${target}
\`\`\`

The shim is released in lockstep with \`${target}\` and is supported for a limited time; see the migration guide of the \`${target}\` repository for the timeline.
`;
}

export function renderPackageJson({ legacy, target, version, license, repository, subpaths }) {
  const major = String(version).split(".")[0];
  const exportsMap = {};
  for (const subpath of subpaths) {
    const js = `./dist/${subpath.file}.js`;
    exportsMap[subpath.key] = { types: `./dist/${subpath.file}.d.ts`, "react-native": js, import: js, default: js };
  }
  exportsMap["./package.json"] = "./package.json";
  const pkg = {
    name: legacy,
    version,
    description: `Deprecated alias of ${target}: re-exports everything from ${target}.`,
    license,
    type: "module",
    sideEffects: false,
    main: "./dist/index.js",
    module: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: exportsMap,
    files: ["dist", "README.md", "LICENSE"],
    dependencies: { [target]: `^${major}.0.0` },
    publishConfig: { registry: "https://registry.npmjs.org/", access: "public", tag: "latest" },
  };
  if (repository) pkg.repository = repository;
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
