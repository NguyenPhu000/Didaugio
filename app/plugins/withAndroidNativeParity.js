const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
} = require("expo/config-plugins");

module.exports = function withAndroidNativeParity(config) {
  config = withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      modConfig.modResults,
    );
    application.$["android:usesCleartextTraffic"] = "false";
    return modConfig;
  });

  return withAndroidStyles(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Styles.assignStylesValue(
      modConfig.modResults,
      {
        add: true,
        name: "android:enforceNavigationBarContrast",
        value: "true",
        targetApi: "29",
        parent: AndroidConfig.Styles.getAppThemeGroup(),
      },
    );
    return modConfig;
  });
};
