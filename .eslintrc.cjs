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
    // TypeScript (strict + noUnusedLocals) already checks these, and the base
    // ESLint versions misreport type-only names.
    "no-undef": "off",
    "no-unused-vars": "off",
  },
};
