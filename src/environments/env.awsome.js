// @ts-check
// An AWSOME server or container: the dashboard reads the awsome.json that this
// same host publishes, so awsomeConfigUrl is RELATIVE. That keeps the app
// working wherever it is mounted - http://localhost:8002/ in a local container,
// or behind a reverse proxy on a subpath such as https://models.<host>/dev/ -
// and it stops a container from silently showing the production data instead of
// its own. Bulletin/auth calls still go to the shared backend.
/** @type {import("./environment-type").Environment} */
globalThis.ENV = {
  initialUrl: "modelling/awsome",
  apiBaseUrl: "https://dev.avalanche.report/api/",
  textcatUrl: "https://dev.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "dcfg/awsome.json",
  headerBgColor: "#19abff",
  faviconPath: "assets/img/admin-favicon-dev.ico",
  logoPath: "assets/img/admin-logo-dev.svg",
};
