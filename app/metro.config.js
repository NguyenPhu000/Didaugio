const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// lucide-react-native ships ESM .mjs files; Metro needs 'mjs' in sourceExts
// to resolve imports like `./icons/a-arrow-down.mjs` from the package entry.
config.resolver.sourceExts.push("mjs");

module.exports = withNativeWind(config, { input: "./global.css" });
