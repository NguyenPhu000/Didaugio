const appJson = require("./app.json");

const GOOGLE_SIGNIN_PLUGIN = "@react-native-google-signin/google-signin";

function deriveIosUrlScheme(iosClientId) {
  if (!iosClientId || !iosClientId.includes(".apps.googleusercontent.com")) {
    return null;
  }

  const prefix = iosClientId.replace(".apps.googleusercontent.com", "");
  if (!prefix) return null;

  return `com.googleusercontent.apps.${prefix}`;
}

module.exports = ({ config }) => {
  const expoConfig = config || appJson.expo || {};
  const plugins = Array.isArray(expoConfig.plugins)
    ? [...expoConfig.plugins]
    : [];

  const alreadyConfigured = plugins.some((plugin) => {
    if (Array.isArray(plugin)) return plugin[0] === GOOGLE_SIGNIN_PLUGIN;
    return plugin === GOOGLE_SIGNIN_PLUGIN;
  });

  if (!alreadyConfigured) {
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
    const iosUrlScheme = deriveIosUrlScheme(iosClientId);

    if (iosUrlScheme) {
      plugins.push([GOOGLE_SIGNIN_PLUGIN, { iosUrlScheme }]);
    } else {
      plugins.push(GOOGLE_SIGNIN_PLUGIN);
    }
  }

  // Add expo-localization plugin if not already present
  const hasLocalization = plugins.some((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name === "expo-localization";
  });
  if (!hasLocalization) {
    plugins.push("expo-localization");
  }

  for (const pluginName of [
    "@react-native-community/datetimepicker",
    "@sentry/react-native",
    "expo-image",
  ]) {
    const alreadyConfigured = plugins.some((plugin) => {
      if (Array.isArray(plugin)) return plugin[0] === pluginName;
      return plugin === pluginName;
    });

    if (!alreadyConfigured) {
      plugins.push(pluginName);
    }
  }

  const hasStatusBarPlugin = plugins.some((plugin) => {
    if (Array.isArray(plugin)) return plugin[0] === "expo-status-bar";
    return plugin === "expo-status-bar";
  });
  if (!hasStatusBarPlugin) {
    plugins.push(["expo-status-bar", { style: "light" }]);
  }

  if (!plugins.includes("./plugins/withAndroidNativeParity")) {
    plugins.push("./plugins/withAndroidNativeParity");
  }

  return {
    ...expoConfig,
    plugins,
  };
};
