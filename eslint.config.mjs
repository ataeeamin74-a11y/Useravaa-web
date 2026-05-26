import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    ".phase-profile-eqe-package/**",
    ".tools/**",
    "build/**",
    "coverage/**",
    "docs/**",
    "next-env.d.ts",
    "node_modules/**",
    "out/**",
    "prototype/**"
  ])
]);
