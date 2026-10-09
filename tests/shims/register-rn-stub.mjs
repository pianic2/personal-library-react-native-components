// Registers a resolve hook so that plain `node` can import built output: "react-native" resolves to the test shim
// (tests/shims/react-native.tsx), which tsx transpiles on the fly.
// Usage: node --import ./tests/shims/register-rn-stub.mjs -e "await import('./dist/index.js')"
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { register as registerTsx } from "tsx/esm/api";

registerTsx();
const shim = pathToFileURL(new URL("./react-native.tsx", import.meta.url).pathname).href;
const hook = `export function resolve(specifier, context, nextResolve) { return specifier === "react-native" ? nextResolve(${JSON.stringify(shim)}, context) : nextResolve(specifier, context); }`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);
