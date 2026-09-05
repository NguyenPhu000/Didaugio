const { withNativeWind } = require("nativewind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname, {
  includeWebReplay: false,
  includeWebFeedback: false,
});

// lucide-react-native ships ESM .mjs files; Metro needs 'mjs' in sourceExts
// to resolve imports like `./icons/a-arrow-down.mjs` from the package entry.
config.resolver.sourceExts.push("mjs");

module.exports = withNativeWind(config, { input: "./global.css" });
