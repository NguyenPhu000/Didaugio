module.exports = function (api) {
  api.cache(true);
  // Reanimated 4 re-exports the worklets Babel plugin; resolving from project root
  // avoids Metro transform-worker failing to resolve `react-native-worklets/plugin`
  // when required from inside `node_modules/react-native-reanimated/plugin`.
  const workletsBabelPlugin = require.resolve("react-native-worklets/plugin");
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Expo auto-injects the worklets/reanimated Babel plugin when it sees
          // these packages installed. Disable that so Metro doesn't try to resolve
          // the plugin from inside `babel-preset-expo`'s dependency tree.
          worklets: false,
          reanimated: false,
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      workletsBabelPlugin,
    ],
  };
};
