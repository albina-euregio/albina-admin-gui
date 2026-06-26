// @ts-check
// Local development against the Aran (lauegi.report) backend.
// Selected by `pnpm start-aran` via scripts/use-env.mjs.
/** @type {import("./environment-type").Environment} */
globalThis.ENV = {
  initialUrl: "",
  apiBaseUrl: "https://api.lauegi.report/api/",
  textcatUrl: "https://admin.lauegi.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon-aran.ico",
  logoPath: "assets/img/admin-logo-aran.svg",
};
