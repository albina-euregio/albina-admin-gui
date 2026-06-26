// @ts-check
// Production backend. Used by the deploy:production CI job (copied to env.js).
/** @type {import("./environment-type").Environment} */
globalThis.ENV = {
  initialUrl: "",
  apiBaseUrl: "https://avalanche.report/api/",
  textcatUrl: "https://avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.awsome.alpsolut.eu/dcfg/awsome.json",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
};
