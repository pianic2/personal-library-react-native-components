// @ai-example
import { NavBar } from "@personal-library/react-native-components";

const items = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
];

export function NavBarExample() {
  return <NavBar layout="top" items={items} pathname="/" navigate={(href) => console.log(href)} />;
}
