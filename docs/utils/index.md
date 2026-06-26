# Utils

Questa sezione ricalca l’albero dei file in `utils/`.

- [cn](cn.md) — internal / non-stable
- [mergeStyles](merge-styles.md) — experimental
- [platform](platform.md) — experimental

## Export pubblici

Current consumer examples must import only from the public package entrypoint,
for example `@personal-library/react-native-components`.

Root-public utilities currently documented for consumers:

- `mergeStyles`
- `platform` helpers

`cn` is documented as internal / non-stable and is not part of the public
consumer API. It is not exported from the package root and must not be imported
from repository internals or unpublished package subpaths.
