import { useState } from "react";
import {
  Carousel,
  Column,
  PageIndicator,
  Pager,
  Text,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

const slides = ["Welcome", "Browse your library", "Share with friends"];

export function PagerExample() {
  const [index, setIndex] = useState(0);

  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Pager
            count={slides.length}
            index={index}
            onIndexChange={setIndex}
            renderPage={(i) => <Text>{slides[i]}</Text>}
            accessibilityLabel="Onboarding"
          />
          <PageIndicator count={slides.length} index={index} />

          <Carousel
            count={slides.length}
            peek={24}
            autoplay
            autoplayInterval={5000}
            renderPage={(i) => <Text>{slides[i]}</Text>}
          />
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
