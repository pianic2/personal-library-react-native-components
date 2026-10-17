// @ai-example
import { NavBar } from "@personal-library/react-native-components";

export function NavBarExample() {
  return <NavBar layout="top" items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }]} pathname="/" navigate={() => undefined} />;
}
