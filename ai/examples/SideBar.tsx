// @ai-example
import { NavProvider, SideBar } from "@personal-library/react-native-components";

export function SideBarExample() {
  return (
    <NavProvider items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }]} pathname="/" navigate={() => undefined}>
      <SideBar />
    </NavProvider>
  );
}
