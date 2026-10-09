# SideBar

**Stability:** experimental — provisional API, not recommended for production dependency.

Barra di navigazione laterale. Un solo file (`src/components/SideBar/SideBar.tsx`) copre web e native con rami su `Platform.OS`.

## Import

```ts
import { SideBar } from "@personal-library/react-native-components";
```

## Props

```ts
export interface SideBarProps {
  width?: number; // default 280
  variant?: "fixed" | "embedded";
}
```

La barra legge le voci e il percorso attivo da `NavProvider` (`useOptionalNav`); senza provider non mostra voci.

## Comportamento per piattaforma

| | Web | Native |
| --- | --- | --- |
| Variante di default | `fixed` | `embedded` |
| `fixed` | posizionata `fixed` a sinistra, a tutta altezza (`top`/`bottom` 0, `zIndex` sticky) | si estende in altezza (`alignSelf: stretch`) |
| `embedded` | `relative`, si estende in altezza | larghezza fissa, nessuno stretch |
| Pulsante di compressione | sì: riduce la larghezza a 72 e nasconde le etichette (restano le icone) | no |

La voce attiva (`pathname === href`) ha etichetta in grassetto e sfondo evidenziato.

## Note

- Il posizionamento `fixed` esiste solo su web: il valore è convertito in un unico helper tipizzato (`webFixedPosition`), senza `any`.
- Il tipo condiviso `SideBarItem` descrive una voce (stessa forma di `NavItem`); non è esportato dal pacchetto.
- Variante di default, accessibilità del pulsante di compressione e documentazione estesa sono rimandate al ticket E6-30.
- Su native `SideBar` non ritorna `null`: renderizza la lista di navigazione. Per le app mobili resta comunque preferibile `BottomBar` o un overlay.
