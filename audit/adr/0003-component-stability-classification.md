# ADR 0003: Component Stability Classification

## Stato

Proposto

## Contesto

Il repository contiene componenti con maturita diversa. Alcuni possono essere usati come base della libreria, altri sono prototipi, altri dipendono da comportamento web-only o hanno bug noti.

La sola presenza nel codice sorgente non rende un componente parte della API pubblica stabile.

## Decisione

Ogni componente deve avere una classificazione esplicita:

- `stable`
- `beta`
- `experimental`
- `internal`
- `deprecated`

## Categorie

### Stable

Componente pronto per consumer reali.

Criteri minimi:

- props tipizzate ed esportabili;
- comportamento documentato;
- supporto platform dichiarato;
- esempi minimi;
- test minimi o smoke test;
- nessun bug runtime noto bloccante;
- compatibilita gestita con semver.

Garanzia API: breaking changes solo in major release o migrazione dichiarata.

### Beta

Componente usabile, ma contratto ancora in consolidamento.

Criteri minimi:

- props tipizzate;
- comportamento principale funzionante;
- documentazione base;
- limiti noti dichiarati.

Garanzia API: breaking changes possibili in minor release, ma devono essere tracciati.

### Experimental

Componente utile per esplorazione o preview.

Criteri minimi:

- non deve rompere build;
- deve dichiarare limiti e piattaforme supportate;
- non deve essere presentato come stabile.

Garanzia API: nessuna stabilita promessa.

### Internal

Componente o helper usato solo dalla libreria.

Criteri minimi:

- non esportato da entrypoint pubblici;
- non documentato come API consumer.

Garanzia API: puo cambiare senza preavviso.

### Deprecated

Componente ancora presente per compatibilita temporanea.

Criteri minimi:

- alternativa documentata;
- motivazione della deprecazione;
- finestra di rimozione o milestone.

Garanzia API: mantenimento limitato e comunicato.

## Conseguenze

La documentazione e l'export policy devono mostrare lo stato del componente. Un componente `experimental` non deve finire nella root API stabile.

## Debiti noti

- La classificazione iniziale deve essere derivata dall'audit tecnico.
- Mancano test minimi uniformi per molti componenti.
- Alcuni componenti hanno behavior diverso tra web e native.

## Verifica

Ogni componente promosso a `stable` deve avere:

- docs minime;
- props TypeScript pulite;
- example reale;
- support matrix;
- smoke test o verifica equivalente.

## Risoluzione PLRNUI-59 per RC scope

Stato lifecycle: resta `Proposto`.

Decisione RC-scope registrata:

- Nessun componente o API viene promosso a `stable` da PLRNUI-59.
- La postura RC-hardening resta beta/experimental/internal dove indicato.
- La pubblicazione RC resta bloccata se docs/demo comunicano falsa stabilita.

Evidenza:

- `README.md` dichiara che nessun componente o API e attualmente classificato
  `stable`.
- `audit/release/plrnui-12-senior-rc-readiness-review.md` registra la deriva
  residua tra maturity matrix e root export come difetto non bloccante per
  hardening, ma non chiuso per publish.
- `audit/risk-assessment/rc-risk-disposition-plrnui-59.md` registra RA 0003
  come `TRACKED CONDITION`.

Blocco residuo:

- La riconciliazione finale della component maturity matrix e della surface
  stabile resta in PLRNUI-60 / PLRNUI-41.
