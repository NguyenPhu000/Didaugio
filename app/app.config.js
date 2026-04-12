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

module.exports = () => {
  const expoConfig = appJson.expo || {};
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

  return {
    ...expoConfig,
    plugins,
  };
};
