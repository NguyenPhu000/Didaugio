const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const expect = (condition, message) => {
  if (!condition) throw new Error(`[native-config] ${message}`);
};

const config = JSON.parse(read("app.json")).expo;
const resolvedConfig = require("../app.config.js")({ config });
const pluginPath = "./plugins/withAndroidNativeParity";
const ignoredPaths = new Set(read(".gitignore").split(/\r?\n/).map((line) => line.trim()));

expect(ignoredPaths.has("/android"), "generated Android directory must be ignored");
expect(ignoredPaths.has("/ios"), "generated iOS directory must be ignored");
expect(config.android?.package, "expo.android.package is missing");
expect(config.android?.allowBackup === false, "Android backup must be disabled");
expect(config.scheme, "expo.scheme is missing");
expect(config.updates?.url, "expo.updates.url is missing");
expect(config.runtimeVersion, "expo.runtimeVersion is missing");
expect(config.orientation === "portrait", "portrait orientation is required");
expect(
  resolvedConfig.plugins?.includes(pluginPath) && fs.existsSync(path.join(root, "plugins/withAndroidNativeParity.js")),
  "Android native parity config plugin is missing",
);

const splashPlugin = config.plugins?.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
);
expect(splashPlugin?.[1]?.backgroundColor, "splash background color is missing");
expect(splashPlugin?.[1]?.image, "splash image is missing");
expect(fs.existsSync(path.join(root, splashPlugin[1].image)), "splash image file is missing");

for (const permission of config.android.permissions || []) {
  expect(typeof permission === "string" && permission.length > 0, "Android permission is invalid");
}
for (const permission of config.android.blockedPermissions || []) {
  expect(typeof permission === "string" && permission.length > 0, "Android blocked permission is invalid");
}

console.log("Native Android configuration is declared for Expo prebuild.");
