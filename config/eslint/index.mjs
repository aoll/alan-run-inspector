import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import careerHub from "./plugin.mjs";

const DB = {
  group: ["**/lib/db", "**/lib/db/**"],
  message: "The database is read only by lib/dal (entry → service → DAL).",
};
const NEXT = {
  group: ["next", "next/*"],
  message: "Services are framework-free: no next/* import (keep them testable).",
};
const DAL = { group: ["**/lib/dal", "**/lib/dal/**"], message: "Entries call services, never the DAL directly." };

const TESTS = ["**/*.test.{ts,tsx}", "**/*.spec.ts", "**/test/**", "**/e2e/**"];
const TOOLING = [
  "**/scripts/**",
  ".claude/**",
  "**/.claude/**/*.{js,mjs,ts}",
  "**/forge/src/**",
  "**/forge/test/**",
  "*.config.{ts,mts,mjs,js}",
  "**/*.config.{ts,mts,mjs,js}",
  "drizzle/**",
];

/** Shared ESLint config for every app and brick of the hub. */
const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "career-hub": careerHub },
    rules: {
      // Only the validated `env` module reads process.env.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Read environment variables through lib/env.ts, never process.env.",
        },
      ],
      // Only lib/dal (and its infrastructure) imports the database.
      "no-restricted-imports": ["error", { patterns: [DB] }],
      "career-hub/no-server-import-in-client": "error",
    },
  },
  {
    // i18n: no hardcoded text (apps' UI code only).
    files: ["**/*.tsx"],
    ignores: [...TESTS, "**/components/ui/**"],
    rules: { "career-hub/no-hardcoded-text": "error" },
  },
  {
    files: ["**/lib/dal/**/*.ts", "**/lib/services/**/*.ts"],
    ignores: TESTS,
    rules: { "career-hub/require-server-only": "error" },
  },
  {
    // Entries (actions, routes, pages): services only.
    files: ["**/app/**/*.{ts,tsx}"],
    ignores: TESTS,
    rules: { "no-restricted-imports": ["error", { patterns: [DB, DAL] }] },
  },
  {
    // Services: no db, no next/*, no direct DAL bypass of authorization.
    files: ["**/lib/services/**/*.ts"],
    ignores: TESTS,
    rules: { "no-restricted-imports": ["error", { patterns: [DB, NEXT] }] },
  },
  {
    files: ["**/lib/dal/**", "**/lib/db/**", "**/lib/auth.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Public DAL: data any visitor may read. It must never depend on the session.
    files: ["**/lib/dal/public/**/*.ts"],
    ignores: TESTS,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/dal/session", "../session", "./session"],
              message: "The public DAL never reads the session: put session-dependent code in lib/dal.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/lib/env.ts", ...TOOLING, ...TESTS],
    rules: { "no-restricted-syntax": "off", "no-restricted-imports": "off" },
  },
  prettier, // last: turns off formatting rules
  globalIgnores([
    "**/components/ui/**",
    "**/hooks/use-mobile.ts",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "coverage/**",
    ".turbo/**",
    "drizzle/**",
  ]),
]);

export default config;
