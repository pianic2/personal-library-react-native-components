// @ai-example
import { useState } from "react";
import { PageIndicator, Pager, Text } from "@personal-library/react-native-components";

export function PagerExample() {
  const [index, setIndex] = useState(0);

  return (
    <>
      <Pager count={3} index={index} onIndexChange={setIndex} renderPage={(i) => <Text>{`Page ${i + 1}`}</Text>} />
      <PageIndicator count={3} index={index} />
    </>
  );
}
