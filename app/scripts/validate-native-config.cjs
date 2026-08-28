const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const fail = (message) => {
  throw new Error(`[native-config] ${message}`);
};
const expect = (condition, message) => {
  if (!condition) fail(message);
};
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (source, value) => source.includes(value);

const appConfig = JSON.parse(read("app.json")).expo;
const manifest = read("android/app/src/main/AndroidManifest.xml");
const strings = read("android/app/src/main/res/values/strings.xml");
const colors = read("android/app/src/main/res/values/colors.xml");
const styles = read("android/app/src/main/res/values/styles.xml");
const gradle = read("android/app/build.gradle");
const splashLogoPath = path.join(root, "android/app/src/main/res/drawable/splashscreen_logo.xml");

const androidPackage = appConfig.android?.package;
expect(androidPackage, "expo.android.package is missing");
expect(
  new RegExp(`applicationId\\s+['\"]${escapeRegExp(androidPackage)}['\"]`).test(gradle),
  `native applicationId does not match ${androidPackage}`,
);

const updateUrl = appConfig.updates?.url;
expect(updateUrl, "expo.updates.url is missing");
expect(has(manifest, `android:value=\"${updateUrl}\"`), "native EAS Update URL is stale");

const runtimeVersion = String(appConfig.runtimeVersion);
expect(has(strings, `name=\"expo_runtime_version\" translatable=\"false\">${runtimeVersion}<`), "native runtime version is stale");

const scheme = appConfig.scheme;
expect(scheme, "expo.scheme is missing");
expect(has(manifest, `android:scheme=\"${scheme}\"`), `native deep-link scheme ${scheme} is missing`);

if (appConfig.orientation === "portrait") {
  expect(has(manifest, 'android:screenOrientation=\"portrait\"'), "native orientation is not portrait");
}

const splashPlugin = appConfig.plugins?.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
);
const splashBackground = Array.isArray(splashPlugin) ? splashPlugin[1]?.backgroundColor : undefined;
expect(splashBackground, "expo-splash-screen backgroundColor is missing");
expect(fs.existsSync(splashLogoPath), "native splash logo resource is missing");
expect(
  new RegExp(`<color\\s+name=\"splashscreen_background\">${escapeRegExp(splashBackground)}<`).test(colors),
  "native splash background does not match app config",
);

const statusBarBackground = appConfig.androidStatusBar?.backgroundColor;
expect(statusBarBackground, "expo.androidStatusBar.backgroundColor is missing");
expect(has(styles, `android:statusBarColor\">${statusBarBackground}<`), "native status bar color does not match app config");

if (appConfig.androidStatusBar?.barStyle === "light-content") {
  expect(has(styles, 'android:windowLightStatusBar\">false<'), "native status bar text is not light-content");
}

for (const permission of appConfig.android?.permissions || []) {
  expect(has(manifest, `android:name=\"${permission}\"`), `native permission is missing: ${permission}`);
}

for (const permission of appConfig.android?.blockedPermissions || []) {
  expect(
    new RegExp(`android:name=\"${escapeRegExp(permission)}\"[^>]*tools:node=\"remove\"`).test(manifest),
    `native blocked permission is not removed: ${permission}`,
  );
}

console.log("Native Android configuration matches app.json for release-critical fields.");
