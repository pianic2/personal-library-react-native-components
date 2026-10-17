// @ai-example
import { Button, NavProvider, useNavigate } from "@personal-library/react-native-components";

function GoToDocs() {
  const navigate = useNavigate();
  return <Button label="Docs" onPress={() => navigate("/docs")} />;
}

export function NavContextExample() {
  return (
    <NavProvider items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }]} pathname="/" navigate={() => undefined}>
      <GoToDocs />
    </NavProvider>
  );
}
