// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["dist/**"],
  },
  expoConfig,
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        expect: "readonly",
        test: "readonly",
      },
    },
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          project: "./jsconfig.json",
        },
        node: true,
      },
    },
  }
]);
