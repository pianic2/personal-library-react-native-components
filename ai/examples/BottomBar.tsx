// @ai-example
import { BottomBar, NavProvider } from "@personal-library/react-native-components";

export function BottomBarExample() {
  return (
    <NavProvider items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }]} pathname="/" navigate={() => undefined}>
      <BottomBar position="static" />
    </NavProvider>
  );
}
