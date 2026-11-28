module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    // TypeScript (strict, noUnusedLocals) already checks these. The base ESLint
    // versions misreport TypeScript code — e.g. type-only names, or a component
    // called `Text`/`Screen` clashing with the browser globals of the same name.
    "no-undef": "off",
    "no-unused-vars": "off",
    "no-redeclare": "off",
  },
  overrides: [
    {
      // Test helpers re-export Testing Library; Fast Refresh doesn't apply to tests.
      files: ["src/test/**", "**/*.test.ts", "**/*.test.tsx"],
      rules: { "react-refresh/only-export-components": "off" },
    },
  ],
};
