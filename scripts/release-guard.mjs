import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));

const errors = [];
const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

requireValue(pkg.name === "@personal-library/react-native-components", "unexpected package name");
requireValue(/^\d+\.\d+\.\d+-rc\.\d+$/.test(pkg.version), `version must be an RC prerelease, found ${pkg.version}`);
requireValue(pkg.version !== "0.0.0", "0.0.0 is not publishable");
requireValue(lock.version === pkg.version, "package-lock top-level version does not match package.json");
requireValue(lock.packages?.[""]?.version === pkg.version, "package-lock root package version does not match package.json");
requireValue(pkg.license === "MIT", `license must be MIT, found ${pkg.license}`);
requireValue(pkg.repository?.type === "git", "repository.type must be git");
requireValue(
  pkg.repository?.url === "git+https://github.com/pianic2/personal-library-react-native-components.git",
  "repository.url is not canonical"
);
requireValue(pkg.publishConfig?.registry === "https://registry.npmjs.org/", "publishConfig.registry must be npmjs");
requireValue(pkg.publishConfig?.access === "public", "scoped package must publish as public");
requireValue(pkg.publishConfig?.tag === "rc", "RC must publish with dist-tag rc, never latest");
requireValue(pkg.publishConfig?.tag !== "latest", "latest dist-tag is forbidden for the first RC");
requireValue(pkg.engines?.node === ">=22.13.0", "Node engine baseline drifted");
requireValue(pkg.peerDependencies?.react === ">=19.2.3 <20.0.0", "React peer baseline drifted");
requireValue(pkg.peerDependencies?.["react-native"] === ">=0.86.0 <0.87.0", "React Native peer baseline drifted");
requireValue(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0, "runtime dependencies require renewed native/dependency governance");

const allowedFiles = new Set(["dist", "README.md", "LICENSE"]);
requireValue(Array.isArray(pkg.files), "files whitelist is required");
for (const entry of pkg.files ?? []) {
  requireValue(allowedFiles.has(entry), `unexpected publish whitelist entry: ${entry}`);
}
for (const required of allowedFiles) {
  requireValue(pkg.files?.includes(required), `missing publish whitelist entry: ${required}`);
}

if (errors.length) {
  console.error("RC publication guard failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`RC publication guard passed for ${pkg.name}@${pkg.version}`);
console.log(`registry=${pkg.publishConfig.registry} access=${pkg.publishConfig.access} tag=${pkg.publishConfig.tag}`);
