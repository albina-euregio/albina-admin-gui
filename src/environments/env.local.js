// @ts-check
// Local development against http://localhost:8080 (the defaults in environment.ts).
// Selected by `pnpm start` / `pnpm start-local` via scripts/use-env.mjs.
/** @type {import("./environment-type").Environment} */
globalThis.ENV = {
  initialUrl: "",
  apiBaseUrl: "http://localhost:8080/albina/api/",
  textcatUrl: "https://dev.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#8e2232",
  faviconPath: "assets/img/admin-favicon-local.ico",
  logoPath: "assets/img/admin-logo-local.svg",
};
