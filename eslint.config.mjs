import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Mutable sim in a ref + manual re-render; reading `.current` during render is intentional here.
  {
    files: ["components/fcfs/fcfs-simulator.tsx"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  // CommonJS scripts use require(); keep them lint-clean without rewriting the toolchain.
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
