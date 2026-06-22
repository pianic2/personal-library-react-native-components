# 07 - Risks

## Risk Matrix

| ID | Categoria | Rischio | Severita |
| --- | --- | --- | --- |
| R-01 | Packaging | Package pubblicato con entrypoint incoerenti | Critica |
| R-02 | Runtime | Dark mode non funziona nel tema base | Critica |
| R-03 | Runtime | Componenti esportati ma rotti (`Card`, `ProgressBar`, `CodeInline`, `Textarea`) | Alta |
| R-04 | API | Superficie pubblica troppo ampia | Alta |
| R-05 | Naming | AURA resta in package/docs/API | Alta |
| R-06 | Dependencies | Peer dependencies incomplete | Alta |
| R-07 | Platform | Web/native behavior divergente non dichiarato | Alta |
| R-08 | Maintenance | Storage auth dentro UI library | Alta |
| R-09 | Build | Preview usa shim non equivalenti al package | Media |
| R-10 | Types | Props pubbliche non esportate e uso `any` | Media |

## Findings

### Finding RSK-01

- File/percorso: `package.json:5-14`
- Problema: entrypoint package incoerenti.
- Impatto: rischio pubblicazione non consumabile.
- Severita: Critica
- Raccomandazione: bloccare publish finche `npm pack --dry-run`, typecheck e build non sono verdi.

### Finding RSK-02

- File/percorso: `theme/defaultTheme.tsx:13-17`
- Problema: dark mode base non risolve `darkColors`.
- Impatto: promessa funzionale del tema non mantenuta.
- Severita: Critica
- Raccomandazione: correggere prima di formalizzare theme API.

### Finding RSK-03

- File/percorso: `index.ts:5-28`
- Problema: prototipi e moduli app-specific sono pubblici.
- Impatto: alto rischio di breaking changes durante migrazione.
- Severita: Alta
- Raccomandazione: introdurre stati API e deprecation policy.

### Finding RSK-04

- File/percorso: `README.md:1-23`, `mkdocs.yml:1-3`, `package.json:2-4`
- Problema: naming legacy AURA su package/docs.
- Impatto: confusione per Jira/Confluence, consumer e pubblicazione.
- Severita: Alta
- Raccomandazione: piano migration naming con mapping old -> new.

### Finding RSK-05

- File/percorso: `package.json:24-39`
- Problema: dipendenze runtime host non modellate come peer.
- Impatto: installazioni consumer fragili e possibili duplicazioni RN.
- Severita: Alta
- Raccomandazione: ridisegnare dependency policy prima del publish.

### Finding RSK-06

- File/percorso: `components/navigation/SideBar.tsx`, `components/navigation/SideBar.web.tsx`, `components/overlay/Tooltip.tsx`, `components/overlay/Popover.tsx`
- Problema: comportamenti web-only/native-null non segnalati nell'API.
- Impatto: consumer native potrebbero usare componenti che non mostrano contenuto.
- Severita: Alta
- Raccomandazione: documentare platform support e separare componenti web-only/experimental.

### Finding RSK-07

- File/percorso: `storage/*`, `theme/themeStorage.ts`
- Problema: storage app/auth e storage tema coesistono nel package UI.
- Impatto: responsabilita non coerente con libreria componenti, possibili problemi privacy/security e accoppiamento app.
- Severita: Alta
- Raccomandazione: rimuovere auth token storage dal core UI.

### Finding RSK-08

- File/percorso: `components/form/PasswordInput.tsx:7`, `components/form/Textarea.tsx:23`, `theme/types.ts:59`, `theme/createTheme.ts:9-12`
- Problema: uso di `any` in API o logica centrale.
- Impatto: riduce affidabilita TypeScript e rende piu difficile stabilizzare contratti pubblici.
- Severita: Media
- Raccomandazione: tipizzare props e override prima della release.

