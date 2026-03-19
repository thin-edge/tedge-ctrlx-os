// ESLint Konfiguration für moderne ESLint-Versionen (ab v9)
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
