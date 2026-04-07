import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "**/*": "vp fmt --no-error-on-unmatched-pattern",
  },
  fmt: {
    arrowParens: "always",
    bracketSameLine: false,
    bracketSpacing: true,
    endOfLine: "lf",
    htmlWhitespaceSensitivity: "css",
    ignorePatterns: ["pnpm-lock.yaml", "**/*-snapshots"],
    importOrderParserPlugins: ["decorators", "typescript"],
    printWidth: 120,
    proseWrap: "preserve",
    quoteProps: "as-needed",
    semi: true,
    singleAttributePerLine: false,
    singleQuote: false,
    sortImports: {},
    tabWidth: 2,
    trailingComma: "all",
    useTabs: false,
  },
});
