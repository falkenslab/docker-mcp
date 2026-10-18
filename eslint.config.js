import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "docs/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    // stdout is the MCP channel: anything printed there corrupts the protocol.
    files: ["src/**/*.ts"],
    // Settings go through setting(), which treats an unexpanded ${user_config.*} as not set.
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      "no-restricted-syntax": ["error", { selector: "MemberExpression[object.object.name='process'][object.property.name='env']", message: "Read settings with setting() from src/settings.ts." }],
    },
  },
);
