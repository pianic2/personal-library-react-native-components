import { useState } from "react";
import { Row, ThemeAppShell, ThemeProvider } from "@personal-library/react-native-components";
// Chip is not on the root export yet (the wave-wiring ticket adds it); switch to the package import then.
import { Chip } from "../src/components/Chip/index.js";

export function ChipExample() {
  const [onSale, setOnSale] = useState(true);
  const [tags, setTags] = useState(["design", "mobile"]);
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Row gap="sm">
          <Chip label="On sale" selected={onSale} onSelectedChange={setOnSale} />
          {tags.map((tag) => (
            <Chip key={tag} label={tag} variant="outline" tone="neutral" onRemove={() => setTags(tags.filter((t) => t !== tag))} />
          ))}
        </Row>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
