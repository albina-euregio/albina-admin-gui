// Local development against the dev backend (https://dev.avalanche.report).
// Selected by `pnpm start-dev` / `pnpm dev` via scripts/use-env.mjs.
globalThis.ENV = {
  initialUrl: "",
  apiBaseUrl: "https://dev.avalanche.report/api/",
  textcatUrl: "https://dev.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#f4ea12",
  faviconPath: "assets/img/admin-favicon-dev.ico",
  logoPath: "assets/img/admin-logo-dev.svg",
};
