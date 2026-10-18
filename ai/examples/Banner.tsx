// @ai-example
import { Banner } from "@personal-library/react-native-components";

export function BannerExample() {
  return <Banner tone="warning" title="You are offline" message="Changes sync when you reconnect." onDismiss={() => undefined} />;
}
