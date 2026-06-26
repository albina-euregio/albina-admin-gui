// @ts-check
// Local development against the beta backend.
// Selected by `pnpm start-beta` via scripts/use-env.mjs.
/** @type {import("./environment-type").Environment} */
globalThis.ENV = {
  initialUrl: "",
  apiBaseUrl: "https://avalanche.report/api/",
  textcatUrl: "https://avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.awsome.alpsolut.eu/dcfg/awsome.json",
  headerBgColor: "#839194",
  faviconPath: "assets/img/admin-favicon-beta.ico",
  logoPath: "assets/img/admin-logo-beta.svg",
};
