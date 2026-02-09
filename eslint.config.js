// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const pluginJest = require('eslint-plugin-jest');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
  files: ["**/__tests__/**/*.{js,ts,tsx}"],
  plugins: { jest: pluginJest },
  languageOptions: {
    globals: pluginJest.environments.globals.globals,
  }
}
]);
