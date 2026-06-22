# Risk Assessment 0001: Package Rename and Legacy Alias Risk

## Stato

Proposto

## Rischio

Il rename da AURA / UI Experience a `react-native-components` puo rompere import path, package metadata, documentazione o consumer esistenti se i riferimenti legacy vengono rimossi, mantenuti o aliasati senza una policy esplicita.

## Contesto

ADR 0001 decide che `react-native-components` e il nome canonico e che AURA / UI Experience sono nomi storici/deprecati. ADR 0008 richiede migrazione tracciata e breaking changes espliciti.

La review evidenzia che il nome npm finale resta aperto, che la policy alias legacy non e ancora completamente definita e che serve audit dei riferimenti `@aura/ui`, `AURA`, `auraTokens`, import path e package metadata prima di accettare la decisione.

## Cause probabili

- Package name storico ancora presente in metadata o docs.
- Token, export o import path con naming AURA.
- Consumer interni che importano dal vecchio package.
- Alias legacy mantenuti senza deprecation notice.
- Rename applicato in blocco senza migration guide.

## Impatto

- Consumer: build rotte per import path non risolti o API rinominate senza alias.
- Package: metadata incoerente, publish con nome o descrizione legacy.
- Documentazione: esempi con import vecchi o naming ambiguo.
- Sviluppo: confusione tra progetto, package npm, namespace interno e branding.
- Release: breaking changes non comunicati o non versionati correttamente.
- Governance: ticket Jira e pagine Confluence non allineati sul nome canonico.

## Probabilità

Alta.

## Severità

Alta.

## Mitigazioni

- Definire il nome npm finale prima del publish.
- Creare mapping legacy -> nuovo nome per package, import, token, docs e simboli pubblici.
- Mantenere alias legacy solo se motivati, documentati e deprecati.
- Collegare ogni rimozione alias a ticket Jira e milestone.
- Aggiornare README, docs, examples e changelog di migrazione in una fase dedicata.
- Cercare riferimenti legacy nel repository prima di promuovere ADR 0001 ad `Accettato`.

## Segnali di allarme

- Presenza di `@aura/ui`, `AURA`, `UI Experience`, `auraTokens` in nuovi artefatti non storici.
- README o docs che mostrano import path legacy.
- Consumer/demo che richiedono alias non documentati.
- Changelog senza sezione rename o migration path.
- Ticket Jira che mescolano rename con refactor non correlati.

## Verifica

- Nome npm finale approvato.
- Search repository completata per riferimenti legacy.
- Mapping legacy -> nuovo nome pubblicato in docs/migration guide.
- Alias legacy pubblici marcati come deprecated o rimossi con breaking change esplicito.
- README, docs e examples usano `react-native-components`.
- Changelog di migrazione include impatto consumer e migration path.

## Collegamenti

- ADR collegati: ADR 0001, ADR 0008.
- Review collegata: ADR 0001 richiede decisione sul nome npm finale e policy alias; ADR 0008 richiede changelog/migration note e tracciamento dei breaking changes.

