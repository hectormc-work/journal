import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      ".yarn/**",
      // piqued-generated
      "packages/db/src/postgres.ts",
      "packages/db/src/tables.ts",
      "packages/db/src/queries/**/*.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ["packages/client/**", "packages/ui-common/**"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["packages/server/**", "packages/db/**", "scripts/**", "*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // ui-common's public components are a Bootstrap-style primitive kit
    // (Button, Alert, Sidebar, ...) — single-word names are the point,
    // and these are locally-imported SFCs, not global custom elements,
    // so there's no native-tag collision risk to guard against.
    files: ["packages/ui-common/src/components/**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  eslintConfigPrettier,
);
