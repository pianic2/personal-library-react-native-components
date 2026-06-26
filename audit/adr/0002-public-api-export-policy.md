# ADR 0002: Public API Export Policy

## Stato

Proposto

## Contesto

Una libreria componenti pubblicabile deve distinguere tra API pubblica stabile e moduli interni. Nel codice originario, la presenza di barrel exports ampi puo rendere pubblici componenti, hook, storage, utility e temi non ancora stabilizzati.

Senza una export policy, ogni refactor interno rischia di diventare breaking change per i consumer.

## Decisione

La API pubblica di `react-native-components` deve essere esposta solo tramite entrypoint controllati.

Sono candidati a export pubblico:

- componenti UI classificati almeno `stable` o `beta`;
- hook progettati per uso consumer;
- `ThemeProvider`, hook tema pubblici e tipi tema;
- tokens pubblici e tipi token;
- tipi props dei componenti pubblici;
- utility solo se hanno un contratto consumer chiaro.

Devono restare interni:

- helper privati dei componenti;
- storage applicativo o auth-specific;
- utility usate solo dal codice sorgente;
- hook interni di context non pensati per consumer;
- demo helpers;
- shim di preview;
- moduli sperimentali non documentati.

I deep import da cartelle interne non sono parte del contratto. I consumer devono importare solo dagli entrypoint documentati.

## EntryPoint

La root API deve restare intenzionale e ridotta. Subpath exports possono essere introdotti per aree stabili:

- `components`
- `theme`
- `tokens`
- `hooks`
- `types`

Gli entrypoint sperimentali devono essere espliciti, ad esempio con namespace `experimental`, e non devono essere confusi con la API stabile.

## Garanzie

Un export pubblico stabile segue versionamento semantico:

- patch: bugfix compatibili;
- minor: nuove API compatibili;
- major: breaking changes.

Un export interno puo cambiare senza preavviso. Un export beta puo cambiare con nota di release. Un export experimental puo essere rimosso o modificato finche non viene promosso.

## Conseguenze

La migrazione richiede una matrice public/internal prima di ridisegnare i barrel exports. Componenti gia presenti nel codice non devono essere automaticamente esportati dalla root.

## Debiti noti

- Alcuni moduli attuali sembrano pubblici solo perche esportati da barrel.
- I tipi props di vari componenti non sono esportati.
- Alcuni moduli, come storage auth o shim web, non appartengono al core UI.

## Verifica

Prima della release candidate:

- export map approvata;
- deep import non documentati rimossi dagli esempi;
- docs allineate agli entrypoint pubblici;
- changelog dei breaking changes generato.

## Risoluzione PLRNUI-59 per RC scope

Stato lifecycle: resta `Proposto`.

Decisione RC-scope registrata:

- La root API corrente resta l'unico entrypoint consumer supportato insieme a
  `./package.json`.
- Non vengono introdotti subpath exports in PLRNUI-59.
- Gli export experimental/root-visible restano pre-stable e non sono promossi.

Evidenza:

- `package.json` espone solo `"."` e `"./package.json"`.
- `src/index.ts` usa export nominati espliciti, senza broad `export *` root.
- `audit/api/internal-experimental-export-fencing-plrnui-26.md` registra la
  rimozione root di `cn` e `useIsMounted` e la postura degli export
  experimental.
- PLRNUI-46 e PLRNUI-58 consumano solo il package root.

Blocco residuo:

- `audit/api/export-matrix.md` mantiene punti `HUMAN REVIEW REQUIRED`; questi
  impediscono di trattare l'intera policy come approvata/stabile.
