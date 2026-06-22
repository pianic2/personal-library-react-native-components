# Audit Index

This index summarizes the imported PLRNUI audit evidence. These files are
governance and migration evidence, not runtime source, consumer-facing
documentation, or package API.

Legacy references are historical unless a later PLRNUI ticket explicitly
promotes or migrates the related code, package metadata, or public API.

| Area | Purpose | Notes |
|---|---|---|
| adr | Architecture decision records and ADR review evidence. | Imported ADRs can preserve legacy references for traceability. |
| api | Export matrix, root API, subpath, public type, and deep-import analysis. | Does not stabilize API by itself. |
| components | Component classification, blockers, maturity, and promotion requirements. | Does not migrate or promote components by itself. |
| dependencies | Dependency classification, native dependency gates, peer policy, and workflow risks. | Used for package and consumer validation planning. |
| docs | Documentation, demo, naming, and stability-label audit evidence. | Internal audit evidence, not consumer-facing docs. |
| migration | Breaking-change register, legacy naming map, and migration changelog. | Migration execution requires later tickets. |
| release | Package, export, install, runtime, and release readiness evidence. | Release checks are evidence, not publish approval. |
