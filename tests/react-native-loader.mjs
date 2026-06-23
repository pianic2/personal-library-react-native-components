import { pathToFileURL } from "node:url";

const reactNativeShimUrl = pathToFileURL(
  new URL("./shims/react-native.tsx", import.meta.url).pathname
).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "react-native") {
    return {
      shortCircuit: true,
      url: reactNativeShimUrl,
    };
  }

  return nextResolve(specifier, context);
}
