// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["dist/**"],
  },
  expoConfig,
  {
    files: ["**/*.test.js", "**/*.test.jsx"],
    languageOptions: {
      globals: {
        describe: "readonly",
        expect: "readonly",
        test: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  },
  {
    files: ["scripts/**", "*.cjs", "*.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "expo/no-dynamic-env-var": "off",
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
